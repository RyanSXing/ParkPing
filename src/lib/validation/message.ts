import { z } from "zod";

const BLOCKED_WORDS = ["kill", "hurt", "threat", "revenge"];
const RESPECTFUL_MESSAGE = "Please keep the message respectful.";

export function sanitizeMessage(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

export const messageSchema = z
  .string()
  .optional()
  .refine((value) => !value || value.length <= 200)
  .transform((value) => sanitizeMessage(value ?? ""))
  .pipe(z.string().max(200))
  .refine(
    (value) => {
      const normalized = value.toLowerCase();
      return !BLOCKED_WORDS.some((word) =>
        new RegExp(`\\b${word}\\b`, "i").test(normalized),
      );
    },
    { message: RESPECTFUL_MESSAGE },
  );
