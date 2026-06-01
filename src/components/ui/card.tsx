import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={twMerge(
        "rounded-lg border border-[#E4ECFC] bg-white p-5 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
