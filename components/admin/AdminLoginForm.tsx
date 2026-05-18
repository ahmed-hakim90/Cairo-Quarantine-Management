"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirebaseAuth,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";
import { feedbackToast } from "@/lib/ui/feedback-toast";

type AdminLoginFormProps = {
  redirectTo: string;
};

export function AdminLoginForm({ redirectTo }: AdminLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);
      window.location.assign(redirectTo);
    } catch (error) {
      const text =
        error instanceof Error
          ? error.message
          : "تعذر تسجيل الدخول، حاول مرة أخرى.";
      setMessage(text);
      feedbackToast.error(text);
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {!configured ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
          Firebase client env غير مضبوط. أضف متغيرات NEXT_PUBLIC_FIREBASE_*.
        </div>
      ) : null}
      {message ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {message}
        </div>
      ) : null}
      <label className="block text-sm font-bold text-gov-navy">
        البريد الإلكتروني
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          className="mt-2 w-full rounded-md border border-gov-gray-200 bg-white px-3 py-3 text-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
          placeholder="admin@example.com"
        />
      </label>
      <label className="block text-sm font-bold text-gov-navy">
        كلمة المرور
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
          className="mt-2 w-full rounded-md border border-gov-gray-200 bg-white px-3 py-3 text-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
          placeholder="••••••••"
        />
      </label>
      <button
        type="submit"
        disabled={pending || !configured}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-gov-accent px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-gov-navy disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "جاري الدخول..." : "دخول لوحة التحكم"}
      </button>
    </form>
  );
}
