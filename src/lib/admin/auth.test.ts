import { beforeEach, describe, expect, it, vi } from "vitest";

import { isAdminEmail, requireAdminUser } from "./auth";

const adminEnv = vi.hoisted(() => ({
  emails: ["admin@example.com"],
}));

const supabaseServer = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
}));

const navigation = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/env", () => ({
  env: {
    ADMIN_EMAILS: adminEnv.emails,
  },
}));

vi.mock("@/lib/supabase/server", () => supabaseServer);

vi.mock("next/navigation", () => navigation);

describe("admin authorization helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminEnv.emails.splice(0, adminEnv.emails.length, "admin@example.com");
  });

  it("allows emails in the admin allowlist", () => {
    expect(isAdminEmail("Admin@Example.com")).toBe(true);
  });

  it("rejects non-admin authenticated users", async () => {
    supabaseServer.createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: "resident@example.com" } },
        }),
      },
    });

    await expect(requireAdminUser()).rejects.toThrow(
      "redirect:/admin/login?unauthorized=1",
    );
  });

  it("fails closed when the admin allowlist is empty", async () => {
    adminEnv.emails.splice(0, adminEnv.emails.length);

    supabaseServer.createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: "admin@example.com" } },
        }),
      },
    });

    await expect(requireAdminUser()).rejects.toThrow(
      "redirect:/admin/login?unauthorized=1",
    );
  });
});
