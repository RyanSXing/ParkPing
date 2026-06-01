import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdminUser } from "@/lib/admin/queries";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminUser();

  return (
    <div className="min-h-screen bg-[#F0F9FF] text-slate-950">
      <AdminNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
