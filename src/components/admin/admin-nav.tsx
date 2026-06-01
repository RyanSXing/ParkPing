"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/incidents", label: "Incidents" },
  { href: "/admin/notifications", label: "Notifications" },
];

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-[#E4ECFC] bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/admin" className="text-lg font-bold text-slate-950">
          ParkPing Admin
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Admin">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={twMerge(
                  "whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-[#2563EB]",
                  isActivePath(pathname, link.href) &&
                    "bg-[#F0F9FF] text-[#2563EB]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Button
            type="button"
            onClick={handleLogout}
            className="min-h-9 bg-slate-900 px-3 py-1.5 text-xs hover:bg-slate-700"
          >
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
