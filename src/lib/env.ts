import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NOTIFICATION_MODE: z.enum(["simulated", "sms", "email"]).default("simulated"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  REQUESTER_HASH_SECRET: z.string().default("parkping-dev-secret"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NOTIFICATION_MODE: process.env.NOTIFICATION_MODE,
  APP_BASE_URL: process.env.APP_BASE_URL,
  REQUESTER_HASH_SECRET: process.env.REQUESTER_HASH_SECRET,
});

export function hasSupabaseAdminEnv() {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}
