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

  it("returns an empty string for missing or malformed email addresses", () => {
    expect(maskEmail(null)).toBe("");
    expect(maskEmail(undefined)).toBe("");
    expect(maskEmail("resident")).toBe("");
    expect(maskEmail("resident@")).toBe("");
    expect(maskEmail("@example.com")).toBe("");
    expect(maskEmail("resident@example.com@backup")).toBe("");
  });

  it("accepts missing phone inputs without leaking raw values", () => {
    expect(normalizeNorthAmericanPhone(null)).toBe("");
    expect(normalizeNorthAmericanPhone(undefined)).toBe("");
    expect(maskPhone(null)).toBe("");
    expect(maskPhone(undefined)).toBe("");
  });

  it("fails closed for malformed or short phone inputs", () => {
    expect(normalizeNorthAmericanPhone("1234")).toBe("");
    expect(normalizeNorthAmericanPhone("abc123")).toBe("");
    expect(normalizeNorthAmericanPhone("555-0123 ext 9")).toBe("");

    expect(maskPhone("1234")).toBe("");
    expect(maskPhone("abc123")).toBe("");
    expect(maskPhone("555-0123 ext 9")).toBe("");
  });
});
