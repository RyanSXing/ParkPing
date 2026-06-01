import type { Notification } from "../supabase/types";
import { maskEmail, maskPhone } from "../validation/contact";

type SupabaseInsertResult<T> = {
  data: T | null;
  error: { message?: string } | Error | null;
};

type SupabaseInsertClient<T> = {
  from(table: "notifications"): {
    insert(payload: Partial<Notification>): {
      select(): {
        single(): Promise<SupabaseInsertResult<T>>;
      };
    };
  };
};

type AlertOwner = {
  phone: string | null;
  email: string | null;
};

type AlertVehicle = {
  plate_number: string;
  colour: string | null;
  make: string | null;
  model: string | null;
};

export type SendSimulatedParkingAlertInput = {
  incidentId: string;
  resolveToken: string;
  owner: AlertOwner;
  vehicle: AlertVehicle;
  location?: string | null;
  appBaseUrl: string;
};

function createResolveLink(appBaseUrl: string, resolveToken: string): string {
  return `${appBaseUrl.replace(/\/+$/, "")}/resolve/${encodeURIComponent(resolveToken)}`;
}

function describeVehicle(vehicle: AlertVehicle): string {
  const descriptionParts = [
    vehicle.colour,
    vehicle.make,
    vehicle.model,
  ].filter((part): part is string => Boolean(part?.trim()));

  if (descriptionParts.length === 0) {
    return `vehicle with plate ${vehicle.plate_number}`;
  }

  return `${descriptionParts.join(" ")} with plate ${vehicle.plate_number}`;
}

function buildSimulatedMessage({
  vehicle,
  location,
  resolveLink,
}: {
  vehicle: AlertVehicle;
  location?: string | null;
  resolveLink: string;
}): string {
  const locationText = location?.trim() || "in the shared parking area";

  return `Parking alert: your ${describeVehicle(vehicle)} was pinged ${locationText}. Resolve: ${resolveLink}`;
}

function getMaskedRecipient(owner: AlertOwner): string {
  return maskPhone(owner.phone) || maskEmail(owner.email);
}

function getInsertErrorMessage(error: SupabaseInsertResult<unknown>["error"]): string {
  if (!error) {
    return "Notification insert returned no data";
  }

  return error.message || "Notification insert failed";
}

export async function sendSimulatedParkingAlert<TNotification extends Notification>(
  client: SupabaseInsertClient<TNotification>,
  input: SendSimulatedParkingAlertInput,
): Promise<TNotification> {
  const resolveLink = createResolveLink(input.appBaseUrl, input.resolveToken);
  const simulatedMessage = buildSimulatedMessage({
    vehicle: input.vehicle,
    location: input.location,
    resolveLink,
  });

  const payload: Partial<Notification> = {
    incident_id: input.incidentId,
    method: "simulated",
    recipient_masked: getMaskedRecipient(input.owner),
    delivery_status: "simulated_sent",
    simulated_message: simulatedMessage,
    resolve_link: resolveLink,
    provider_message_id: null,
    provider_response: null,
    sent_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("notifications")
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    throw new Error(getInsertErrorMessage(error));
  }

  return data;
}
