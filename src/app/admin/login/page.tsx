import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { isAdminEmail } from "@/lib/admin/auth";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    unauthorized?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const hasSupabasePublicEnv = Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  let user: { email?: string | null } | null = null;

  if (hasSupabasePublicEnv) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    user = currentUser;
  }

  if (isAdminEmail(user?.email)) {
    redirect("/admin");
  }

  const showUnauthorized = Boolean(user) || params?.unauthorized === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F0F9FF] px-4 py-10 text-slate-950">
      <section className="w-full max-w-sm">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#059669]">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            Sign in to ParkPing
          </h1>
        </div>
        <Card>
          {showUnauthorized ? (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
              This account is not authorized for ParkPing admin.
            </p>
          ) : null}
          <LoginForm />
        </Card>
      </section>
    </main>
  );
}
