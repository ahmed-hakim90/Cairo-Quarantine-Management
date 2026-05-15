"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import type { Office } from "@/lib/office-requests/types";

type SuperAdminDashboardOfficeFilterProps = {
  locale: string;
  offices: Office[];
  /** After server validation; null = كل المكاتب */
  selectedOfficeId: string | null;
  /** Controls shown beside the office select (e.g. export). */
  trailingActions?: ReactNode;
};

export function SuperAdminDashboardOfficeFilter({
  locale,
  offices,
  selectedOfficeId,
  trailingActions,
}: SuperAdminDashboardOfficeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const value = selectedOfficeId ?? "";

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    startTransition(() => {
      const path = pathname.startsWith(`/${locale}`)
        ? pathname
        : `/${locale}/admin`;
      const params = new URLSearchParams(searchParams.toString());
      if (!next) {
        params.delete("officeId");
      } else {
        params.set("officeId", next);
      }
      const qs = params.toString();
      router.push(qs ? `${path}?${qs}` : path);
    });
  }

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-1">
      <label
        htmlFor="dashboard-office-filter"
        className="text-xs font-bold text-gov-gray-600"
      >
        تصفية حسب المكتب
      </label>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <select
          id="dashboard-office-filter"
          value={value}
          onChange={onChange}
          disabled={pending}
          className="min-h-10 min-w-0 max-w-full flex-1 rounded-md border border-gov-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gov-navy shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-navy disabled:opacity-60"
        >
          <option value="">كل المكاتب</option>
          {offices.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nameAr}
              {!o.active ? " (غير نشط)" : ""}
            </option>
          ))}
        </select>
        {trailingActions ? (
          <div className="shrink-0">{trailingActions}</div>
        ) : null}
      </div>
    </div>
  );
}
