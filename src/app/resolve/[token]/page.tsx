import { isResolveTokenExpired } from "@/lib/incidents";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ResolveButton } from "./resolve-button";

type ResolvePageProps = {
  params: Promise<{
    token: string;
  }>;
};

function InvalidLinkState() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-lg border border-[var(--border)] bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--secondary)]">
          ParkPing
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">
          This resolve link is invalid or expired.
        </h1>
        <p className="mt-4 leading-7 text-slate-700">
          The alert may already be closed, or the link may no longer be active.
        </p>
      </section>
    </main>
  );
}

export default async function ResolvePage({ params }: ResolvePageProps) {
  const { token } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: incident, error } = await supabase
    .from("incidents")
    .select("plate_number_snapshot,location,resolve_token_expires_at")
    .eq("resolve_token", token)
    .maybeSingle();

  if (
    error ||
    !incident ||
    isResolveTokenExpired(incident.resolve_token_expires_at)
  ) {
    return <InvalidLinkState />;
  }

  const location = incident.location?.trim() || "Shared parking area";

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-lg border border-[var(--border)] bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--secondary)]">
          ParkPing resolve
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">
          Mark this parking alert resolved
        </h1>
        <dl className="mt-6 divide-y divide-[var(--border)] rounded-md border border-[var(--border)] bg-[var(--muted)]">
          <div className="px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Plate
            </dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--foreground)]">
              {incident.plate_number_snapshot}
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Location
            </dt>
            <dd className="mt-1 text-base text-slate-700">{location}</dd>
          </div>
        </dl>
        <ResolveButton token={token} />
      </section>
    </main>
  );
}
