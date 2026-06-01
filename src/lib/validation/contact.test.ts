import { describe, expect, it } from "vitest";

import { maskEmail, maskPhone, normalizeNorthAmericanPhone } from "./contact";

describe("contact validation helpers", () => {
  it("normalizes North American phone numbers to E.164", () => {
    expect(normalizeNorthAmericanPhone("(416) 555-0123")).toBe("+14165550123");
  });

  it("masks phone numbers except the last four digits", () => {
    expect(maskPhone("+14165550123")).toBe("(***) ***-0123");
  });

  it("masks email addresses while preserving the domain", () => {
    expect(maskEmail("resident@example.com")).toBe("r***@example.com");
  });
});
