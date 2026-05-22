"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirebaseAuth,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";
import {
  mapAdminSessionError,
  mapFirebaseAuthError,
} from "@/lib/admin/auth-errors";
import type { AdminAuthMessages } from "@/lib/i18n/messages";
import { feedbackToast } from "@/lib/ui/feedback-toast";

type AdminLoginFormProps = {
  redirectTo: string;
  copy: AdminAuthMessages;
};

type SessionErrorResponse = {
  error?: string;
  code?: string;
};

function readFirebaseErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return code === undefined || code === null ? undefined : String(code);
  }
  return undefined;
}

export function AdminLoginForm({ redirectTo, copy }: AdminLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const configured = isFirebaseClientConfigured();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    try {
      const credential = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        password,
      );
      const idToken = await credential.user.getIdToken();
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CQM-Admin-Request": "1",
        },
        body: JSON.stringify({ idToken }),
      });
      const data = (await response.json()) as SessionErrorResponse;
      if (!response.ok) {
        throw Object.assign(new Error("session_failed"), {
          sessionCode: data.code,
        });
      }
      window.location.assign(redirectTo);
    } catch (error) {
      const sessionCode =
        error &&
        typeof error === "object" &&
        "sessionCode" in error &&
        typeof (error as { sessionCode?: unknown }).sessionCode === "string"
          ? (error as { sessionCode: string }).sessionCode
          : undefined;

      const text = sessionCode
        ? mapAdminSessionError(sessionCode, copy.errors)
        : mapFirebaseAuthError(readFirebaseErrorCode(error), copy.errors);

      setMessage(text);
      feedbackToast.error(text);
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {!configured ? (
        <div
          role="alert"
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900"
        >
          {copy.firebaseNotConfigured}
        </div>
      ) : null}
      {message ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800"
        >
          {message}
        </div>
      ) : null}
      <label className="block text-sm font-bold text-gov-navy">
        {copy.emailLabel}
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          className="mt-2 w-full rounded-md border border-gov-gray-200 bg-white px-3 py-3 text-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
          placeholder={copy.emailPlaceholder}
        />
      </label>
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-gov-navy">
            {copy.passwordLabel}
          </span>
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="text-xs font-bold text-gov-accent transition hover:text-gov-navy"
            aria-pressed={showPassword}
          >
            {showPassword ? copy.passwordHide : copy.passwordShow}
          </button>
        </div>
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
          className="mt-2 w-full rounded-md border border-gov-gray-200 bg-white px-3 py-3 text-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={pending || !configured}
        aria-busy={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-gov-accent px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-gov-navy disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}
