import { describe, expect, it } from "vitest";

import { normalizePlate, plateSchema } from "./plate";

describe("plate validation", () => {
  it("normalizes plate text to uppercase alphanumerics", () => {
    expect(normalizePlate(" abc-d 123 ")).toBe("ABCD123");
  });

  it("rejects plates with no alphanumeric characters", () => {
    expect(() => plateSchema.parse(" --- ")).toThrow();
  });
});
