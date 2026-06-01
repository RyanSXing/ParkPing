"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginResponse = {
  success?: boolean;
  message?: unknown;
};

function responseMessage(data: LoginResponse) {
  return typeof data.message === "string" && data.message.trim()
    ? data.message
    : "Unable to log in. Check your credentials and try again.";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as LoginResponse;

      if (!response.ok || data.success === false) {
        setErrorMessage(responseMessage(data));
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMessage("Unable to log in. Check your connection and try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2"
          required
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-slate-900"
        >
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2"
          required
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Signing in..." : "Sign in"}
      </Button>

      {errorMessage ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
