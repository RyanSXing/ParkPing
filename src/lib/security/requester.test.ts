import { describe, expect, it } from "vitest";

import { createRequesterHash, getRequesterSignals } from "./requester";

describe("requester security helpers", () => {
  it("creates stable hashes without leaking raw requester details", () => {
    const firstHash = createRequesterHash("192.0.2.1", "Vitest Browser", "secret");
    const secondHash = createRequesterHash("192.0.2.1", "Vitest Browser", "secret");

    expect(firstHash).toBe(secondHash);
    expect(firstHash).not.toContain("192.0.2.1");
    expect(firstHash).not.toContain("Vitest Browser");
  });

  it("does not collide when requester fields contain separators", () => {
    expect(createRequesterHash("a:b", "c", "secret")).not.toBe(
      createRequesterHash("a", "b:c", "secret"),
    );
  });

  it("reads x-forwarded-for first IP before other requester headers", () => {
    const headers = new Headers({
      "user-agent": "Vitest Browser",
      "x-forwarded-for": "192.0.2.1, 198.51.100.2",
      "x-real-ip": "203.0.113.5",
    });

    expect(getRequesterSignals(headers)).toEqual({
      ipAddress: "192.0.2.1",
      userAgent: "Vitest Browser",
    });
  });

  it("falls back to x-real-ip and unknown user-agent", () => {
    expect(
      getRequesterSignals(new Headers({ "x-real-ip": "203.0.113.5" })),
    ).toEqual({
      ipAddress: "203.0.113.5",
      userAgent: "unknown",
    });
  });

  it("uses unknown sentinels when requester headers are missing", () => {
    expect(getRequesterSignals(new Headers())).toEqual({
      ipAddress: "unknown",
      userAgent: "unknown",
    });
  });
});
