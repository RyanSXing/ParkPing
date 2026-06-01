import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return env.ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export async function requireAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/admin/login?unauthorized=1");
  }

  return user;
}
