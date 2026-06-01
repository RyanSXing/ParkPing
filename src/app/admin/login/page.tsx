import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin");
  }

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
          <LoginForm />
        </Card>
      </section>
    </main>
  );
}
