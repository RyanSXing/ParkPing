import { describe, expect, it } from "vitest";

import {
  createResolveExpiry,
  createResolveToken,
  isResolveTokenExpired,
} from "./incidents";

describe("incident helpers", () => {
  it("creates URL-safe resolve tokens with at least 32 characters", () => {
    const token = createResolveToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(32);
  });

  it("creates resolve expiries seven days from now", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");

    expect(createResolveExpiry(now)).toBe("2026-06-08T12:00:00.000Z");
  });

  it("treats expired or missing resolve tokens as expired", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");

    expect(isResolveTokenExpired(null, now)).toBe(true);
    expect(isResolveTokenExpired(undefined, now)).toBe(true);
    expect(isResolveTokenExpired("2026-06-01T11:59:59.999Z", now)).toBe(true);
    expect(isResolveTokenExpired("2026-06-01T12:00:00.000Z", now)).toBe(true);
    expect(isResolveTokenExpired("2026-06-01T12:00:00.001Z", now)).toBe(false);
  });
});
