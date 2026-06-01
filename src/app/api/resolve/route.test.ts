import { afterEach, describe, expect, it, vi } from "vitest";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

type IncidentRow = {
  id: string;
  status:
    | "pending"
    | "notified"
    | "resolved"
    | "failed"
    | "rate_limited"
    | "cancelled";
  resolve_token_expires_at: string | null;
};

function createResolveClient({
  incident = {
    id: "incident-1",
    status: "notified",
    resolve_token_expires_at: "2026-06-02T12:00:00.000Z",
  },
  lookupError = null,
  updateError = null,
}: {
  incident?: IncidentRow | null;
  lookupError?: { message: string } | null;
  updateError?: { message: string } | null;
} = {}) {
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
              expect(value).toBe("valid-resolve-token-123");

              return {
                maybeSingle: async () => ({
                  data: incident,
                  error: lookupError,
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

              return { error: updateError };
            },
          };
        },
      };
    },
  };
}

async function postResolve(body: unknown) {
  return POST(
    new Request("http://localhost/api/resolve", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("POST /api/resolve", () => {
  it("marks an incident resolved for a valid resolve token", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));

    const client = createResolveClient();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    const response = await POST(
      new Request("http://localhost/api/resolve", {
        method: "POST",
        body: JSON.stringify({ token: "valid-resolve-token-123" }),
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
  });

  it("returns invalid link for an invalid body", async () => {
    const response = await postResolve({ token: "short" });

    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "Invalid resolve link.",
    });
    expect(response.status).toBe(400);
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("returns invalid or expired when the incident is missing", async () => {
    const client = createResolveClient({ incident: null });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    const response = await postResolve({ token: "valid-resolve-token-123" });

    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "This resolve link is invalid or expired.",
    });
    expect(response.status).toBe(404);
    expect(client.updatePayloads).toEqual([]);
  });

  it("returns invalid or expired when the token is expired", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));

    const client = createResolveClient({
      incident: {
        id: "incident-1",
        status: "notified",
        resolve_token_expires_at: "2026-06-01T12:00:00.000Z",
      },
    });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    const response = await postResolve({ token: "valid-resolve-token-123" });

    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "This resolve link is invalid or expired.",
    });
    expect(response.status).toBe(404);
    expect(client.updatePayloads).toEqual([]);
  });

  it("returns success idempotently without updating an already resolved incident", async () => {
    const client = createResolveClient({
      incident: {
        id: "incident-1",
        status: "resolved",
        resolve_token_expires_at: "2026-06-02T12:00:00.000Z",
      },
    });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    const response = await postResolve({ token: "valid-resolve-token-123" });

    await expect(response.json()).resolves.toEqual({
      success: true,
      message: "Thanks. This parking alert has been marked resolved.",
    });
    expect(response.status).toBe(200);
    expect(client.updatePayloads).toEqual([]);
  });

  it.each(["cancelled", "failed", "rate_limited"] as const)(
    "returns invalid or expired without updating a %s incident",
    async (status) => {
      const client = createResolveClient({
        incident: {
          id: "incident-1",
          status,
          resolve_token_expires_at: "2026-06-02T12:00:00.000Z",
        },
      });
      vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

      const response = await postResolve({ token: "valid-resolve-token-123" });

      await expect(response.json()).resolves.toEqual({
        success: false,
        message: "This resolve link is invalid or expired.",
      });
      expect(response.status).toBe(404);
      expect(client.updatePayloads).toEqual([]);
    },
  );

  it("returns a generic error when the status update fails", async () => {
    const client = createResolveClient({
      updateError: { message: "database unavailable" },
    });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    const response = await postResolve({ token: "valid-resolve-token-123" });

    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "Unable to resolve this parking alert right now.",
    });
    expect(response.status).toBe(500);
    expect(client.updatePayloads).toHaveLength(1);
  });
});
