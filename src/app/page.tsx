export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--secondary)]">
          ParkPing MVP
        </p>
        <h1 className="mt-3 text-4xl font-bold text-[var(--foreground)] sm:text-5xl">
          Resident-first parking coordination starts here.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-700">
          The Next.js foundation is ready for the ParkPing resident workflow.
        </p>
      </section>
    </main>
  );
}
