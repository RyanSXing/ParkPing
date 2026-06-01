"use client";

import { useState } from "react";

type ResolveButtonProps = {
  token: string;
};

type ResolveResponse = {
  success: boolean;
  message: string;
};

export function ResolveButton({ token }: ResolveButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleResolve() {
    setIsPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const body = (await response.json()) as ResolveResponse;

      setMessage(body.message);
      setIsResolved(body.success);
    } catch {
      setMessage("Unable to resolve this parking alert right now.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={handleResolve}
        disabled={isPending || isResolved}
        className="inline-flex min-h-12 items-center justify-center rounded-md bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending
          ? "Marking resolved..."
          : isResolved
            ? "Resolved"
            : "Mark as resolved"}
      </button>
      {message ? (
        <p className="mt-4 text-sm leading-6 text-slate-700" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
