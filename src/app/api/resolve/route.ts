import { NextResponse } from "next/server";
import { z } from "zod";

import { isResolveTokenExpired } from "@/lib/incidents";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { IncidentStatus } from "@/lib/supabase/types";

const resolveRequestSchema = z.object({
  token: z.string().min(16),
});

const invalidLinkResponse = {
  success: false,
  message: "Invalid resolve link.",
};

const expiredLinkResponse = {
  success: false,
  message: "This resolve link is invalid or expired.",
};

const genericErrorResponse = {
  success: false,
  message: "Unable to resolve this parking alert right now.",
};

const successResponse = {
  success: true,
  message: "Thanks. This parking alert has been marked resolved.",
};

const RESOLVABLE_STATUSES = new Set<IncidentStatus>(["pending", "notified"]);
const UNAVAILABLE_STATUSES = new Set<IncidentStatus>([
  "failed",
  "cancelled",
  "rate_limited",
]);

export async function POST(request: Request) {
  const parsedBody = resolveRequestSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsedBody.success) {
    return NextResponse.json(invalidLinkResponse, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: incident, error: lookupError } = await supabase
    .from("incidents")
    .select("id,status,resolve_token_expires_at")
    .eq("resolve_token", parsedBody.data.token)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(genericErrorResponse, { status: 500 });
  }

  if (
    !incident ||
    isResolveTokenExpired(incident.resolve_token_expires_at)
  ) {
    return NextResponse.json(expiredLinkResponse, { status: 404 });
  }

  if (incident.status === "resolved") {
    return NextResponse.json(successResponse);
  }

  if (
    UNAVAILABLE_STATUSES.has(incident.status) ||
    !RESOLVABLE_STATUSES.has(incident.status)
  ) {
    return NextResponse.json(expiredLinkResponse, { status: 404 });
  }

  const resolvedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("incidents")
    .update({
      status: "resolved",
      resolved_at: resolvedAt,
    })
    .eq("id", incident.id);

  if (updateError) {
    return NextResponse.json(genericErrorResponse, { status: 500 });
  }

  return NextResponse.json(successResponse);
}
