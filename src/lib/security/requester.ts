import { createHash } from "node:crypto";

export type RequesterSignals = {
  ipAddress: string;
  userAgent: string;
};

export function createRequesterHash(
  ipAddress: string,
  userAgent: string,
  secret: string,
): string {
  return createHash("sha256")
    .update(secret)
    .update(":")
    .update(ipAddress)
    .update(":")
    .update(userAgent)
    .digest("hex");
}

export function getRequesterSignals(headers: Headers): RequesterSignals {
  const forwardedFor = headers.get("x-forwarded-for") ?? "";
  const forwardedIp = forwardedFor.split(",")[0]?.trim() ?? "";
  const realIp = headers.get("x-real-ip")?.trim() ?? "";

  return {
    ipAddress: forwardedIp || realIp,
    userAgent: headers.get("user-agent")?.trim() ?? "",
  };
}
