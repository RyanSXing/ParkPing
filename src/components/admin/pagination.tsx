import Link from "next/link";

import type { PaginatedResult } from "@/lib/admin/queries";

type PaginationProps = {
  pageInfo: Pick<PaginatedResult<unknown>, "page" | "totalPages" | "totalItems">;
  basePath: string;
  params: Record<string, string>;
};

function pageHref(basePath: string, params: Record<string, string>, page: number) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  search.set("page", String(page));
  return `${basePath}?${search.toString()}`;
}

export function Pagination({ pageInfo, basePath, params }: PaginationProps) {
  const previousPage = Math.max(1, pageInfo.page - 1);
  const nextPage = Math.min(pageInfo.totalPages, pageInfo.page + 1);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[#E4ECFC] bg-white px-3 py-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Page {pageInfo.page} of {pageInfo.totalPages} · {pageInfo.totalItems} records
      </span>
      <div className="flex gap-2">
        <Link
          href={pageHref(basePath, params, previousPage)}
          aria-disabled={pageInfo.page <= 1}
          className="inline-flex min-h-9 items-center rounded-md border border-[#E4ECFC] px-3 font-semibold text-slate-700 transition hover:bg-slate-50 aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          Previous
        </Link>
        <Link
          href={pageHref(basePath, params, nextPage)}
          aria-disabled={pageInfo.page >= pageInfo.totalPages}
          className="inline-flex min-h-9 items-center rounded-md border border-[#E4ECFC] px-3 font-semibold text-slate-700 transition hover:bg-slate-50 aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          Next
        </Link>
      </div>
    </div>
  );
}
