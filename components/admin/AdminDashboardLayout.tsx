"use client";

import { useEffect, useState } from "react";
import { logoutAdmin } from "@/app/[locale]/admin/actions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { AdminRole } from "@/lib/office-requests/types";

type AdminDashboardLayoutProps = {
  locale: string;
  displayName: string;
  role: AdminRole;
  /** When set for an office user, shown in the header instead of displayName. */
  officeNameAr?: string | null;
  children: React.ReactNode;
};

export function AdminDashboardLayout({
  locale,
  displayName,
  role,
  officeNameAr = null,
  children,
}: AdminDashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerPrimary =
    role !== "super_admin" && officeNameAr?.trim()
      ? officeNameAr.trim()
      : displayName;

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-gov-gray-50 md:flex-row">
      <a
        href="#main-content"
        className="absolute start-4 top-0 z-[100] -translate-y-full rounded-md bg-gov-accent px-4 py-3 text-sm font-semibold text-white shadow-md transition-transform focus:translate-y-4"
      >
        تخطي إلى المحتوى
      </a>
      <AdminSidebar
        locale={locale}
        role={role}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gov-gray-200 bg-white px-4 py-3 shadow-sm md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-gov-gray-200 bg-white text-gov-navy md:hidden"
              aria-expanded={mobileOpen}
              aria-controls="admin-sidebar"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <span className="sr-only">فتح القائمة</span>
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gov-navy">
                {headerPrimary}
              </p>
              <p className="text-xs text-gov-gray-600">
                {role === "super_admin" ? "سوبر أدمن" : "مستخدم مكتب"}
              </p>
            </div>
          </div>
          <form action={logoutAdmin.bind(null, locale)}>
            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-200 px-4 py-2 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50"
            >
              تسجيل خروج
            </button>
          </form>
        </header>

        <main id="main-content" className="flex-1 px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
