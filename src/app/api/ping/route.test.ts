import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendSimulatedParkingAlert } from "@/lib/notifications/simulated";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/notifications/simulated", () => ({
  sendSimulatedParkingAlert: vi.fn(),
}));

const createSupabaseMock = ({
  notificationShouldFail = false,
} = {}) => {
  const vehicle = {
    id: "vehicle-1",
    plate_number: "ABC123",
    colour: "Blue",
    make: "Honda",
    model: "Civic",
    owners: {
      id: "owner-1",
      name: "Private Owner",
      email: "private@example.com",
      phone: "+15551234567",
      unit_number: "1204",
    },
  };

  const incident = {
    id: "incident-1",
    vehicle_id: vehicle.id,
    plate_number_snapshot: vehicle.plate_number,
    location: "P2 north",
    message: "Blocking the ramp",
    status: "pending",
    resolve_token: "resolve-token",
    resolve_token_expires_at: "2026-06-08T12:00:00.000Z",
    requester_hash: "hash",
    created_at: "2026-06-01T12:00:00.000Z",
    resolved_at: null,
  };

  const vehicleQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: vehicle, error: null }),
  };

  const incidentsSelectQuery = {
    select: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue({ data: [], error: null }),
  };

  const incidentInsertQuery = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: incident, error: null }),
  };

  const incidentUpdateQuery = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table === "vehicles") {
        return vehicleQuery;
      }

      if (table === "incidents") {
        return {
          select: () => incidentsSelectQuery,
          insert: (payload: unknown) => {
            incidentInsertQuery.insert(payload);
            return incidentInsertQuery;
          },
          update: (payload: unknown) => {
            incidentUpdateQuery.update(payload);
            return incidentUpdateQuery;
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };

  if (notificationShouldFail) {
    vi.mocked(sendSimulatedParkingAlert).mockRejectedValue(
      new Error("Notification insert failed"),
    );
  } else {
    vi.mocked(sendSimulatedParkingAlert).mockResolvedValue({
      id: "notification-1",
    } as never);
  }

  return {
    client,
    incident,
    incidentInsertQuery,
    incidentUpdateQuery,
    vehicle,
  };
};

describe("POST /api/ping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success without leaking owner private information", async () => {
    const { client, incident } = createSupabaseMock();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    const response = await POST(
      new Request("http://localhost/api/ping", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "203.0.113.10",
          "user-agent": "vitest",
        },
        body: JSON.stringify({
          plateNumber: "abc 123",
          location: "P2 north",
          message: "Blocking the ramp",
        }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      incidentId: incident.id,
      message: "Ping created. The vehicle owner would be notified by the system.",
    });
    expect(JSON.stringify(body)).not.toContain("Private Owner");
    expect(JSON.stringify(body)).not.toContain("private@example.com");
    expect(JSON.stringify(body)).not.toContain("+15551234567");
    expect(JSON.stringify(body)).not.toContain("1204");
    expect(body).not.toHaveProperty("owner");
  });

  it("marks the incident failed when notification delivery fails", async () => {
    const { client, incidentUpdateQuery } = createSupabaseMock({
      notificationShouldFail: true,
    });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    const response = await POST(
      new Request("http://localhost/api/ping", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "203.0.113.10",
          "user-agent": "vitest",
        },
        body: JSON.stringify({
          plateNumber: "abc 123",
          location: "P2 north",
          message: "Blocking the ramp",
        }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      message: "Unable to create ping right now. Please try again later.",
    });
    expect(incidentUpdateQuery.update).toHaveBeenCalledWith({ status: "failed" });
  });

  it("stores requester hash without raw requester or owner private fields", async () => {
    const { client, incidentInsertQuery } = createSupabaseMock();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    const response = await POST(
      new Request("http://localhost/api/ping", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "203.0.113.10",
          "user-agent": "vitest-private-agent",
        },
        body: JSON.stringify({
          plateNumber: "abc 123",
          location: "P2 north",
          message: "Blocking the ramp",
        }),
      }),
    );

    expect(response.status).toBe(200);

    const payload = incidentInsertQuery.insert.mock.calls[0]?.[0];
    const serializedPayload = JSON.stringify(payload);

    expect(payload).toMatchObject({
      vehicle_id: "vehicle-1",
      plate_number_snapshot: "ABC123",
      location: "P2 north",
      message: "Blocking the ramp",
      status: "pending",
    });
    expect(payload.requester_hash).toEqual(expect.any(String));
    expect(serializedPayload).not.toContain("203.0.113.10");
    expect(serializedPayload).not.toContain("vitest-private-agent");
    expect(serializedPayload).not.toContain("Private Owner");
    expect(serializedPayload).not.toContain("private@example.com");
    expect(serializedPayload).not.toContain("+15551234567");
    expect(serializedPayload).not.toContain("1204");
  });
});
