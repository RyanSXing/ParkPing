"use client";

import { FormEvent, useState } from "react";
import { twMerge } from "tailwind-merge";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MESSAGE_LIMIT = 200;

type Result = {
  kind: "success" | "error";
  message: string;
};

type PingResponse = {
  success?: boolean;
  message?: unknown;
};

function readResultMessage(data: PingResponse, fallback: string) {
  return typeof data.message === "string" && data.message.trim()
    ? data.message
    : fallback;
}

export function PingForm() {
  const [plateNumber, setPlateNumber] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setResult(null);

    try {
      const response = await fetch("/api/ping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plateNumber,
          location,
          message,
        }),
      });
      const data = (await response.json()) as PingResponse;
      const resultMessage = readResultMessage(
        data,
        response.ok
          ? "Ping sent. The vehicle owner would be notified by the system."
          : "Unable to send the ping. Please try again.",
      );

      setResult({
        kind: response.ok && data.success !== false ? "success" : "error",
        message: resultMessage,
      });

      if (response.ok && data.success !== false) {
        setPlateNumber("");
        setLocation("");
        setMessage("");
      }
    } catch {
      setResult({
        kind: "error",
        message: "Unable to send the ping. Please try again.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="plateNumber"
          className="block text-sm font-semibold text-slate-900"
        >
          License plate
        </label>
        <Input
          id="plateNumber"
          name="plateNumber"
          value={plateNumber}
          onChange={(event) => setPlateNumber(event.target.value.toUpperCase())}
          placeholder="ABC123"
          autoComplete="off"
          required
          maxLength={16}
          className="mt-2 uppercase tracking-wide"
        />
      </div>

      <div>
        <label
          htmlFor="location"
          className="block text-sm font-semibold text-slate-900"
        >
          Garage location
        </label>
        <Input
          id="location"
          name="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Level P2, space 42"
          autoComplete="off"
          maxLength={120}
          className="mt-2"
        />
      </div>

      <div>
        <div className="flex items-end justify-between gap-3">
          <label
            htmlFor="message"
            className="block text-sm font-semibold text-slate-900"
          >
            Message
          </label>
          <span className="text-xs text-slate-500" aria-live="polite">
            {message.length}/{MESSAGE_LIMIT}
          </span>
        </div>
        <textarea
          id="message"
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Please move when you can."
          maxLength={MESSAGE_LIMIT}
          rows={4}
          className="mt-2 w-full resize-y rounded-md border border-[#E4ECFC] bg-white px-3 py-2 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Sending..." : "Send anonymous ping"}
      </Button>

      {result ? (
        <p
          className={twMerge(
            "rounded-md border px-3 py-2 text-sm leading-6",
            result.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900",
          )}
          role={result.kind === "error" ? "alert" : "status"}
        >
          {result.message}
        </p>
      ) : null}
    </form>
  );
}
