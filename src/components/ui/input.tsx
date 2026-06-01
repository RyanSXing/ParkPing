import type { InputHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={twMerge(
        "min-h-11 w-full rounded-md border border-[#E4ECFC] bg-white px-3 py-2 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15",
        className,
      )}
      {...props}
    />
  );
}
