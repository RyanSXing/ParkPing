import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={twMerge("min-w-full divide-y divide-[#E4ECFC] text-sm", className)}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={twMerge("bg-slate-50", className)} {...props} />;
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={twMerge("divide-y divide-[#E4ECFC] bg-white", className)} {...props} />
  );
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={twMerge("align-top", className)} {...props} />;
}

export function TableHeaderCell({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={twMerge(
        "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={twMerge("whitespace-nowrap px-3 py-2 text-slate-700", className)}
      {...props}
    />
  );
}

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  message?: string;
};

export function EmptyState({ className, title, message, ...props }: EmptyStateProps) {
  return (
    <div
      className={twMerge(
        "rounded-lg border border-dashed border-[#E4ECFC] bg-white px-4 py-8 text-center",
        className,
      )}
      {...props}
    >
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {message ? <p className="mt-1 text-sm text-slate-500">{message}</p> : null}
    </div>
  );
}
