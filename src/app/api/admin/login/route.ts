import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminEmail } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return (
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function loginAttemptKey(request: Request, email: string) {
  return `${getClientIp(request)}:${email.trim().toLowerCase()}`;
}

function isLoginLimited(key: string, now = Date.now()) {
  const attempt = loginAttempts.get(key);

  if (!attempt || attempt.resetAt <= now) {
    return false;
  }

  return attempt.count >= MAX_LOGIN_ATTEMPTS;
}

function recordFailedLogin(key: string, now = Date.now()) {
  const attempt = loginAttempts.get(key);

  if (!attempt || attempt.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }

  loginAttempts.set(key, {
    count: attempt.count + 1,
    resetAt: attempt.resetAt,
  });
}

function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

export function resetAdminLoginLimiterForTests() {
  loginAttempts.clear();
}

export async function POST(request: Request) {
  const parsedBody = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsedBody.success) {
    return NextResponse.json(
      { success: false, message: "Enter a valid email and password." },
      { status: 400 },
    );
  }

  const attemptKey = loginAttemptKey(request, parsedBody.data.email);

  if (isLoginLimited(attemptKey)) {
    return NextResponse.json(
      { success: false, message: "Login failed." },
      { status: 429 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsedBody.data);

  if (error) {
    recordFailedLogin(attemptKey);
    return NextResponse.json(
      { success: false, message: "Login failed." },
      { status: 401 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    recordFailedLogin(attemptKey);
    await supabase.auth.signOut();
    return NextResponse.json(
      { success: false, message: "Login failed." },
      { status: 401 },
    );
  }

  clearLoginAttempts(attemptKey);
  return NextResponse.json({ success: true });
}
