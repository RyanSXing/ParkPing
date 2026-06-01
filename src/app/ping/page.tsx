import Link from "next/link";

import { Card } from "@/components/ui/card";
import { PingForm } from "./ping-form";

export default function PingPage() {
  return (
    <main className="min-h-screen bg-[#F0F9FF] text-slate-950">
      <nav className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-5">
        <Link href="/" className="text-lg font-bold text-slate-950">
          ParkPing
        </Link>
        <Link
          href="/admin/login"
          className="text-sm font-semibold text-slate-700 transition hover:text-[#2563EB]"
        >
          Admin Login
        </Link>
      </nav>

      <section className="mx-auto w-full max-w-3xl px-5 pb-12 pt-4 sm:pt-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#059669]">
            Resident ping
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            Notify a vehicle owner privately.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-700">
            Your request stays anonymous. The owner receives a system
            notification, not your contact info.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Demo mode uses simulated notifications, so no paid SMS/email service
            is required.
          </p>
        </div>

        <Card>
          <PingForm />
        </Card>
      </section>
    </main>
  );
}
