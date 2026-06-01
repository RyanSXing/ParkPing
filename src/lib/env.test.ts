import { afterEach, describe, expect, it, vi } from "vitest";

async function loadEnv() {
  vi.resetModules();
  return import("./env");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("env", () => {
  it("uses the configured app base URL when provided", async () => {
    vi.stubEnv("APP_BASE_URL", "https://parkping.example");
    vi.stubEnv("VERCEL_URL", "parkping-preview.vercel.app");

    const { env } = await loadEnv();

    expect(env.APP_BASE_URL).toBe("https://parkping.example");
  });

  it("falls back to the Vercel deployment URL", async () => {
    vi.stubEnv("APP_BASE_URL", "");
    vi.stubEnv("VERCEL_URL", "parkping-preview.vercel.app");

    const { env } = await loadEnv();

    expect(env.APP_BASE_URL).toBe("https://parkping-preview.vercel.app");
  });

  it("parses optional email notification settings", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("FROM_EMAIL", "ParkPing <alerts@example.com>");

    const { env } = await loadEnv();

    expect(env.RESEND_API_KEY).toBe("re_test_key");
    expect(env.FROM_EMAIL).toBe("ParkPing <alerts@example.com>");
  });
});
