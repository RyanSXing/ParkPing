import { randomBytes } from "node:crypto";

const RESOLVE_TOKEN_BYTES = 32;
const RESOLVE_EXPIRY_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function createResolveToken(): string {
  return randomBytes(RESOLVE_TOKEN_BYTES).toString("base64url");
}

export function createResolveExpiry(now = new Date()): string {
  return new Date(now.getTime() + RESOLVE_EXPIRY_DAYS * DAY_IN_MS).toISOString();
}

export function isResolveTokenExpired(
  expiresAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (!expiresAt) {
    return true;
  }

  const expiryTime = new Date(expiresAt).getTime();

  return Number.isNaN(expiryTime) || expiryTime <= now.getTime();
}
