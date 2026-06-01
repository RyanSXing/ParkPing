import { describe, expect, it } from "vitest";

import { sendSimulatedParkingAlert } from "./simulated";

function createInsertClient() {
  const calls: unknown[] = [];

  return {
    calls,
    from(table: string) {
      return {
        insert(payload: unknown) {
          calls.push({ table, payload });

          return {
            select() {
              return {
                single: async () => ({
                  data: {
                    id: "notification-1",
                    ...(Array.isArray(payload) ? payload[0] : payload),
                    created_at: "2026-06-01T12:00:00.000Z",
                  },
                  error: null,
                }),
              };
            },
          };
        },
      };
    },
  };
}

describe("sendSimulatedParkingAlert", () => {
  it("stores a simulated notification with masked recipient and resolve link", async () => {
    const client = createInsertClient();

    const notification = await sendSimulatedParkingAlert(client, {
      incidentId: "incident-1",
      resolveToken: "resolve-token-123",
      owner: {
        phone: "+14165550123",
        email: "owner@example.com",
      },
      vehicle: {
        plate_number: "ABC123",
        colour: "blue",
        make: "Honda",
        model: "Civic",
      },
      location: "Visitor spot 12",
      appBaseUrl: "https://parkping.example",
    });

    expect(client.calls).toHaveLength(1);
    expect(client.calls[0]).toMatchObject({
      table: "notifications",
      payload: {
        incident_id: "incident-1",
        method: "simulated",
        delivery_status: "simulated_sent",
        recipient_masked: "(***) ***-0123",
        resolve_link: "https://parkping.example/resolve/resolve-token-123",
      },
    });
    expect(notification).toMatchObject({
      method: "simulated",
      delivery_status: "simulated_sent",
      recipient_masked: "(***) ***-0123",
      resolve_link: "https://parkping.example/resolve/resolve-token-123",
    });
    expect(notification.sent_at).toEqual(expect.any(String));
    expect(notification.simulated_message).toContain("blue Honda Civic");
    expect(notification.simulated_message).toContain("ABC123");
    expect(notification.simulated_message).toContain("Visitor spot 12");
  });

  it("falls back to email masking and shared parking area copy", async () => {
    const client = createInsertClient();

    const notification = await sendSimulatedParkingAlert(client, {
      incidentId: "incident-2",
      resolveToken: "resolve-token-456",
      owner: {
        phone: null,
        email: "resident@example.com",
      },
      vehicle: {
        plate_number: "XYZ789",
        colour: null,
        make: null,
        model: null,
      },
      location: "   ",
      appBaseUrl: "https://parkping.example/",
    });

    expect(notification.recipient_masked).toBe("r***@example.com");
    expect(notification.resolve_link).toBe(
      "https://parkping.example/resolve/resolve-token-456",
    );
    expect(notification.simulated_message).toContain(
      "in the shared parking area",
    );
  });

  it("throws when the insert fails or returns no data", async () => {
    const errorClient = {
      from() {
        return {
          insert() {
            return {
              select() {
                return {
                  single: async () => ({
                    data: null,
                    error: { message: "database unavailable" },
                  }),
                };
              },
            };
          },
        };
      },
    };

    await expect(
      sendSimulatedParkingAlert(errorClient, {
        incidentId: "incident-3",
        resolveToken: "resolve-token-789",
        owner: { phone: null, email: null },
        vehicle: {
          plate_number: "NOPE1",
          colour: null,
          make: null,
          model: null,
        },
        location: null,
        appBaseUrl: "https://parkping.example",
      }),
    ).rejects.toThrow("database unavailable");
  });
});
