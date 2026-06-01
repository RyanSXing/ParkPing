import { describe, expect, it } from "vitest";

import { evaluatePingLimits, type IncidentLike } from "./rate-limit";

const NOW = new Date("2026-06-01T12:00:00.000Z");

function incident(
  overrides: Partial<IncidentLike> = {},
): IncidentLike {
  return {
    created_at: "2026-06-01T11:30:00.000Z",
    status: "resolved",
    plate_number_snapshot: "ABC123",
    requester_hash: "requester-1",
    ...overrides,
  };
}

describe("evaluatePingLimits", () => {
  it("blocks the same plate after three pings within an hour", () => {
    const result = evaluatePingLimits({
      now: NOW,
      plateNumber: "ABC123",
      requesterHash: "requester-2",
      incidents: [
        incident({ created_at: "2026-06-01T11:05:00.000Z" }),
        incident({ created_at: "2026-06-01T11:30:00.000Z" }),
        incident({ created_at: "2026-06-01T11:59:00.000Z" }),
      ],
    });

    expect(result).toEqual({
      allowed: false,
      reason: "plate_hour_limit",
    });
  });

  it("counts plate pings exactly one hour old toward the hourly limit", () => {
    const result = evaluatePingLimits({
      now: NOW,
      plateNumber: "ABC123",
      requesterHash: "requester-2",
      incidents: [
        incident({ created_at: "2026-06-01T11:00:00.000Z" }),
        incident({ created_at: "2026-06-01T11:30:00.000Z" }),
        incident({ created_at: "2026-06-01T11:59:00.000Z" }),
      ],
    });

    expect(result).toEqual({
      allowed: false,
      reason: "plate_hour_limit",
    });
  });

  it("blocks duplicate open pings within five minutes", () => {
    const result = evaluatePingLimits({
      now: NOW,
      plateNumber: "abc123",
      requesterHash: "requester-2",
      incidents: [
        incident({
          created_at: "2026-06-01T11:56:00.000Z",
          plate_number_snapshot: "ABC123",
          status: "notified",
        }),
      ],
    });

    expect(result).toEqual({
      allowed: false,
      reason: "duplicate_open_incident",
    });
  });

  it("counts duplicate open pings exactly five minutes old", () => {
    const result = evaluatePingLimits({
      now: NOW,
      plateNumber: "abc123",
      requesterHash: "requester-2",
      incidents: [
        incident({
          created_at: "2026-06-01T11:55:00.000Z",
          plate_number_snapshot: "ABC123",
          status: "pending",
        }),
      ],
    });

    expect(result).toEqual({
      allowed: false,
      reason: "duplicate_open_incident",
    });
  });

  it("blocks a requester after five incidents within twenty-four hours", () => {
    const result = evaluatePingLimits({
      now: NOW,
      plateNumber: "NEW456",
      requesterHash: "requester-1",
      incidents: [
        incident({ created_at: "2026-05-31T12:01:00.000Z" }),
        incident({ created_at: "2026-06-01T01:00:00.000Z" }),
        incident({ created_at: "2026-06-01T04:00:00.000Z" }),
        incident({ created_at: "2026-06-01T08:00:00.000Z" }),
        incident({ created_at: "2026-06-01T10:00:00.000Z" }),
      ],
    });

    expect(result).toEqual({
      allowed: false,
      reason: "requester_day_limit",
    });
  });

  it("counts requester incidents exactly twenty-four hours old toward the daily limit", () => {
    const result = evaluatePingLimits({
      now: NOW,
      plateNumber: "NEW456",
      requesterHash: "requester-1",
      incidents: [
        incident({ created_at: "2026-05-31T12:00:00.000Z" }),
        incident({ created_at: "2026-06-01T01:00:00.000Z" }),
        incident({ created_at: "2026-06-01T04:00:00.000Z" }),
        incident({ created_at: "2026-06-01T08:00:00.000Z" }),
        incident({ created_at: "2026-06-01T10:00:00.000Z" }),
      ],
    });

    expect(result).toEqual({
      allowed: false,
      reason: "requester_day_limit",
    });
  });

  it("allows pings when no limits are reached", () => {
    const result = evaluatePingLimits({
      now: NOW,
      plateNumber: "ABC123",
      requesterHash: "requester-1",
      incidents: [
        incident({ created_at: "2026-06-01T10:00:00.000Z" }),
        incident({ created_at: "2026-06-01T11:45:00.000Z", status: "resolved" }),
      ],
    });

    expect(result).toEqual({ allowed: true });
  });
});
