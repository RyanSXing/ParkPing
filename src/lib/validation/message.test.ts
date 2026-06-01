import { describe, expect, it } from "vitest";

import { messageSchema, sanitizeMessage } from "./message";

describe("message validation", () => {
  it("strips HTML tags from messages", () => {
    expect(sanitizeMessage("<b>Please move</b>")).toBe("Please move");
  });

  it("rejects threatening messages with a respectful error", () => {
    expect(() => messageSchema.parse("I will kill your car")).toThrow(
      "Please keep the message respectful.",
    );
  });

  it("rejects messages longer than 200 characters", () => {
    expect(() => messageSchema.parse("a".repeat(201))).toThrow();
  });

  it("rejects raw messages longer than 200 characters before sanitizing", () => {
    const rawLongMessage = `<span>${"a".repeat(190)}</span>`;

    expect(rawLongMessage).toHaveLength(203);
    expect(sanitizeMessage(rawLongMessage)).toHaveLength(190);
    expect(() => messageSchema.parse(rawLongMessage)).toThrow();
  });
});
