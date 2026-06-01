import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendEmailParkingAlert } from "./email";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn(function ResendMock() {
    return {
      emails: {
        send: sendMock,
      },
    };
  }),
}));

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

describe("sendEmailParkingAlert", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it("sends an email with a resolve link and stores a sent notification", async () => {
    sendMock.mockResolvedValue({
      data: { id: "resend-message-1" },
      error: null,
    });
    const client = createInsertClient();

    const notification = await sendEmailParkingAlert(client, {
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
      resendApiKey: "test-resend-key",
      fromEmail: "ParkPing <alerts@example.com>",
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "ParkPing <alerts@example.com>",
        to: "owner@example.com",
        subject: "Parking alert for ABC123",
      }),
    );
    expect(sendMock.mock.calls[0]?.[0].html).toContain(
      "https://parkping.example/resolve/resolve-token-123",
    );
    expect(client.calls[0]).toMatchObject({
      table: "notifications",
      payload: {
        incident_id: "incident-1",
        method: "email",
        delivery_status: "sent",
        recipient_masked: "o***@example.com",
        resolve_link: "https://parkping.example/resolve/resolve-token-123",
        provider_message_id: "resend-message-1",
      },
    });
    expect(notification).toMatchObject({
      method: "email",
      delivery_status: "sent",
      provider_message_id: "resend-message-1",
    });
  });

  it("throws before sending when the owner has no email address", async () => {
    const client = createInsertClient();

    await expect(
      sendEmailParkingAlert(client, {
        incidentId: "incident-no-email",
        resolveToken: "resolve-token-123",
        owner: {
          phone: "+14165550123",
          email: null,
        },
        vehicle: {
          plate_number: "ABC123",
          colour: null,
          make: null,
          model: null,
        },
        location: null,
        appBaseUrl: "https://parkping.example",
        resendApiKey: "test-resend-key",
        fromEmail: "ParkPing <alerts@example.com>",
      }),
    ).rejects.toThrow("No owner email address available.");

    expect(sendMock).not.toHaveBeenCalled();
    expect(client.calls).toHaveLength(0);
  });

  it("throws when Resend rejects the email", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { message: "domain not verified" },
    });

    await expect(
      sendEmailParkingAlert(createInsertClient(), {
        incidentId: "incident-resend-error",
        resolveToken: "resolve-token-123",
        owner: {
          phone: null,
          email: "owner@example.com",
        },
        vehicle: {
          plate_number: "ABC123",
          colour: null,
          make: null,
          model: null,
        },
        location: null,
        appBaseUrl: "https://parkping.example",
        resendApiKey: "test-resend-key",
        fromEmail: "ParkPing <alerts@example.com>",
      }),
    ).rejects.toThrow("domain not verified");
  });
});
