import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function readPathname(headersList: Headers) {
  return (
    headersList.get("x-matched-path") ??
    headersList.get("x-invoke-path") ??
    headersList.get("next-url") ??
    ""
  );
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = readPathname(headersList);

  if (!user) {
    if (pathname && !pathname.startsWith("/admin/login")) {
      redirect("/admin/login");
    }

    return children;
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] text-slate-950">
      <AdminNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
