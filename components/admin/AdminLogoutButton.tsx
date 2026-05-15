"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import {
  getFirebaseAuth,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";

type AdminLogoutButtonProps = {
  locale: string;
  className?: string;
};

export function AdminLogoutButton({
  locale,
  className = "inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-200 px-4 py-2 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50 disabled:cursor-not-allowed disabled:opacity-60",
}: AdminLogoutButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      if (isFirebaseClientConfigured()) {
        await signOut(getFirebaseAuth()).catch(() => undefined);
      }
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.assign(`/${locale}/admin/login`);
    } catch {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={pending}
      className={className}
    >
      {pending ? "جاري الخروج..." : "تسجيل خروج"}
    </button>
  );
}
