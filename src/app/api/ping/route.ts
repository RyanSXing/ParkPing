import { z } from "zod";

import { env } from "@/lib/env";
import { createResolveExpiry, createResolveToken } from "@/lib/incidents";
import { sendParkingAlert } from "@/lib/notifications/send";
import { evaluatePingLimits, type IncidentLike } from "@/lib/rate-limit";
import { createRequesterHash, getRequesterSignals } from "@/lib/security/requester";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { messageSchema } from "@/lib/validation/message";
import { plateSchema } from "@/lib/validation/plate";

type NotificationClient = Parameters<typeof sendParkingAlert>[0];
type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

const NO_MATCH_MESSAGE =
  "No matching vehicle found. Please check the plate number or contact building management.";
const RATE_LIMIT_MESSAGE =
  "That vehicle was recently pinged. Please wait before sending another alert.";
const SUCCESS_MESSAGE =
  "Ping created. The vehicle owner would be notified by the system.";
const VALIDATION_MESSAGE = "Please check the ping details and try again.";
const SERVER_ERROR_MESSAGE = "Unable to create ping right now. Please try again later.";

const pingRequestSchema = z.object({
  plateNumber: plateSchema,
  location: z
    .string()
    .max(120)
    .optional()
    .transform((value) => value?.trim() ?? ""),
  message: messageSchema,
});

type OwnerRecord = {
  id?: string;
  name?: string | null;
  phone: string | null;
  email: string | null;
  unit_number?: string | null;
};

type VehicleRecord = {
  id: string;
  plate_number: string;
  colour: string | null;
  make: string | null;
  model: string | null;
  owners: OwnerRecord | OwnerRecord[] | null;
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status });
}

function firstOwner(owner: VehicleRecord["owners"]): OwnerRecord | null {
  if (Array.isArray(owner)) {
    return owner[0] ?? null;
  }

  return owner;
}

async function parsePingRequest(request: Request) {
  const body = await request.json();
  return pingRequestSchema.parse(body);
}

async function markIncidentFailed(
  supabase: SupabaseAdminClient,
  incidentId: string,
) {
  await supabase.from("incidents").update({ status: "failed" }).eq("id", incidentId);
}

export async function POST(request: Request) {
  let parsedRequest: z.infer<typeof pingRequestSchema>;

  try {
    parsedRequest = await parsePingRequest(request);
  } catch {
    return jsonResponse({ success: false, message: VALIDATION_MESSAGE }, 400);
  }

  try {
    const requesterSignals = getRequesterSignals(request.headers);
    const requesterHash = createRequesterHash(
      requesterSignals.ipAddress,
      requesterSignals.userAgent,
      env.REQUESTER_HASH_SECRET,
    );
    const supabase = createSupabaseAdminClient();

    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select(
        "id, plate_number, colour, make, model, owners(id, name, phone, email, unit_number)",
      )
      .eq("plate_number", parsedRequest.plateNumber)
      .eq("active", true)
      .maybeSingle();

    if (vehicleError) {
      return jsonResponse({ success: false, message: SERVER_ERROR_MESSAGE }, 500);
    }

    if (!vehicle) {
      return jsonResponse({ success: false, message: NO_MATCH_MESSAGE }, 404);
    }

    const recentSince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentIncidents, error: incidentsError } = await supabase
      .from("incidents")
      .select("created_at, status, plate_number_snapshot, requester_hash")
      .or(
        `plate_number_snapshot.eq.${parsedRequest.plateNumber},requester_hash.eq.${requesterHash}`,
      )
      .gte("created_at", recentSince);

    if (incidentsError) {
      return jsonResponse({ success: false, message: SERVER_ERROR_MESSAGE }, 500);
    }

    const limitResult = evaluatePingLimits({
      plateNumber: parsedRequest.plateNumber,
      requesterHash,
      incidents: (recentIncidents ?? []) as IncidentLike[],
    });

    if (!limitResult.allowed) {
      return jsonResponse({ success: false, message: RATE_LIMIT_MESSAGE }, 429);
    }

    const resolveToken = createResolveToken();
    const { data: incident, error: insertError } = await supabase
      .from("incidents")
      .insert({
        vehicle_id: (vehicle as VehicleRecord).id,
        plate_number_snapshot: parsedRequest.plateNumber,
        location: parsedRequest.location || null,
        message: parsedRequest.message || null,
        status: "pending",
        resolve_token: resolveToken,
        resolve_token_expires_at: createResolveExpiry(),
        requester_hash: requesterHash,
      })
      .select()
      .single();

    if (insertError || !incident) {
      return jsonResponse({ success: false, message: SERVER_ERROR_MESSAGE }, 500);
    }

    const vehicleRecord = vehicle as VehicleRecord;
    const owner = firstOwner(vehicleRecord.owners);

    if (!owner) {
      await markIncidentFailed(supabase, incident.id);
      return jsonResponse({ success: false, message: SERVER_ERROR_MESSAGE }, 500);
    }

    try {
      await sendParkingAlert(supabase as unknown as NotificationClient, {
        incidentId: incident.id,
        resolveToken,
        mode: env.NOTIFICATION_MODE,
        owner: {
          phone: owner.phone,
          email: owner.email,
        },
        vehicle: {
          plate_number: vehicleRecord.plate_number,
          colour: vehicleRecord.colour,
          make: vehicleRecord.make,
          model: vehicleRecord.model,
        },
        location: parsedRequest.location || null,
        appBaseUrl: env.APP_BASE_URL,
        resendApiKey: env.RESEND_API_KEY,
        fromEmail: env.FROM_EMAIL,
      });
    } catch {
      await markIncidentFailed(supabase, incident.id);
      return jsonResponse({ success: false, message: SERVER_ERROR_MESSAGE }, 500);
    }

    const { error: updateError } = await supabase
      .from("incidents")
      .update({ status: "notified" })
      .eq("id", incident.id);

    if (updateError) {
      await markIncidentFailed(supabase, incident.id);
      return jsonResponse({ success: false, message: SERVER_ERROR_MESSAGE }, 500);
    }

    return jsonResponse(
      {
        success: true,
        incidentId: incident.id,
        message: SUCCESS_MESSAGE,
      },
      200,
    );
  } catch {
    return jsonResponse({ success: false, message: SERVER_ERROR_MESSAGE }, 500);
  }
}
