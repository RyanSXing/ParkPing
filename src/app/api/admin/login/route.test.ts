import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST, resetAdminLoginLimiterForTests } from "./route";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/auth";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/admin/auth", () => ({
  isAdminEmail: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

function createLoginRequest(body: unknown, ip = "203.0.113.10") {
  return new Request("http://localhost/api/admin/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAdminLoginLimiterForTests();
  });

  it("returns 400 for an invalid body", async () => {
    const response = await POST(createLoginRequest({ email: "bad" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns 401 when Supabase login fails", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          error: new Error("invalid credentials"),
        }),
      },
    } as never);

    const response = await POST(
      createLoginRequest({
        email: "admin@example.com",
        password: "bad-password",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ success: false, message: "Login failed." });
  });

  it("returns success for an authenticated allowlisted admin", async () => {
    vi.mocked(isAdminEmail).mockReturnValue(true);
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: "admin@example.com" } },
        }),
        signOut: vi.fn(),
      },
    } as never);

    const response = await POST(
      createLoginRequest({
        email: "admin@example.com",
        password: "correct-password",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
  });

  it("throttles repeated failed attempts for the same IP and email", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      error: new Error("invalid credentials"),
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signInWithPassword,
      },
    } as never);

    for (let index = 0; index < 5; index += 1) {
      const response = await POST(
        createLoginRequest({
          email: "admin@example.com",
          password: "bad-password",
        }),
      );

      expect(response.status).toBe(401);
    }

    const response = await POST(
      createLoginRequest({
        email: "admin@example.com",
        password: "bad-password",
      }),
    );

    expect(response.status).toBe(429);
    expect(signInWithPassword).toHaveBeenCalledTimes(5);
  });
});
