import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: string | null;
};

const toneClasses: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  notified: "border-sky-200 bg-sky-50 text-sky-800",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  failed: "border-red-200 bg-red-50 text-red-800",
  simulated_sent: "border-indigo-200 bg-indigo-50 text-indigo-800",
};

function formatBadgeLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function Badge({ className, tone, children, ...props }: BadgeProps) {
  const badgeTone = tone ? toneClasses[tone] : null;
  const label = children ?? (tone ? formatBadgeLabel(tone) : "unknown");

  return (
    <span
      className={twMerge(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize leading-5",
        badgeTone ?? "border-slate-200 bg-slate-50 text-slate-700",
        className,
      )}
      {...props}
    >
      {label}
    </span>
  );
}
