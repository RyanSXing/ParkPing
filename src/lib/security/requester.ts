import { createHmac } from "node:crypto";

const UNKNOWN_REQUESTER_SIGNAL = "unknown";

export type RequesterSignals = {
  ipAddress: string;
  userAgent: string;
};

export function createRequesterHash(
  ipAddress: string,
  userAgent: string,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(JSON.stringify({ ipAddress, userAgent }))
    .digest("hex");
}

export function getRequesterSignals(headers: Headers): RequesterSignals {
  const forwardedFor = headers.get("x-forwarded-for") ?? "";
  const forwardedIp = forwardedFor.split(",")[0]?.trim() ?? "";
  const realIp = headers.get("x-real-ip")?.trim() ?? "";

  return {
    ipAddress: forwardedIp || realIp || UNKNOWN_REQUESTER_SIGNAL,
    userAgent: headers.get("user-agent")?.trim() || UNKNOWN_REQUESTER_SIGNAL,
  };
}
