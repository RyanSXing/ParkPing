import { z } from "zod";

const emptyStringToUndefined = (value: unknown) =>
  value === "" ? undefined : value;

const commaSeparatedEmails = (value: unknown) => {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

const appBaseUrl =
  process.env.APP_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().optional(),
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    emptyStringToUndefined,
    z.string().optional(),
  ),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
    emptyStringToUndefined,
    z.string().optional(),
  ),
  NOTIFICATION_MODE: z.preprocess(
    emptyStringToUndefined,
    z.enum(["simulated", "sms", "email"]).default("simulated"),
  ),
  APP_BASE_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default("http://localhost:3000"),
  ),
  REQUESTER_HASH_SECRET: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).default("parkping-dev-secret"),
  ),
  ADMIN_EMAILS: z.preprocess(
    commaSeparatedEmails,
    z.array(z.email()).default([]),
  ),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NOTIFICATION_MODE: process.env.NOTIFICATION_MODE,
  APP_BASE_URL: appBaseUrl,
  REQUESTER_HASH_SECRET: process.env.REQUESTER_HASH_SECRET,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
});

export function hasSupabaseAdminEnv() {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}
