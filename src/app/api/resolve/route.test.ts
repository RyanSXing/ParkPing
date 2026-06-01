import { describe, expect, it, vi } from "vitest";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

function createResolveClient() {
  const updatePayloads: unknown[] = [];

  return {
    updatePayloads,
    from(table: string) {
      if (table !== "incidents") {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        select() {
          return {
            eq(column: string, value: string) {
              expect(column).toBe("resolve_token");
              expect(value).toBe("valid-resolve-token");

              return {
                maybeSingle: async () => ({
                  data: {
                    id: "incident-1",
                    status: "notified",
                    resolve_token_expires_at: "2026-06-02T12:00:00.000Z",
                  },
                  error: null,
                }),
              };
            },
          };
        },
        update(payload: unknown) {
          updatePayloads.push(payload);

          return {
            eq: async (column: string, value: string) => {
              expect(column).toBe("id");
              expect(value).toBe("incident-1");

              return { error: null };
            },
          };
        },
      };
    },
  };
}

describe("POST /api/resolve", () => {
  it("marks an incident resolved for a valid resolve token", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));

    const client = createResolveClient();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    const response = await POST(
      new Request("http://localhost/api/resolve", {
        method: "POST",
        body: JSON.stringify({ token: "valid-resolve-token" }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      success: true,
      message: "Thanks. This parking alert has been marked resolved.",
    });
    expect(response.status).toBe(200);
    expect(client.updatePayloads).toEqual([
      {
        status: "resolved",
        resolved_at: "2026-06-01T12:00:00.000Z",
      },
    ]);

    vi.useRealTimers();
  });
});
