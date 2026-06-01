import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F0F9FF] text-slate-950">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-6">
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

      <section className="mx-auto flex min-h-[calc(100vh-84px)] w-full max-w-5xl flex-col justify-center px-5 pb-12 pt-8 sm:px-6 lg:pb-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#059669]">
            Anonymous garage notifications
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
            Enter the blocking car&apos;s plate. We notify the owner privately.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
            ParkPing helps residents in shared garages send a private system
            alert without revealing names, phone numbers, emails, or unit
            numbers.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/ping"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
            >
              Ping a Vehicle Owner
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#E4ECFC] bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-[#2563EB] hover:text-[#2563EB]"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
