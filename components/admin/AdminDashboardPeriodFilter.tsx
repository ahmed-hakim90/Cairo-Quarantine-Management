"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  dateInputClass,
  segmentClass,
  SEGMENT_TRAY,
} from "@/components/admin/admin-filter-segments";
import type { AdminBookingDateRange } from "@/lib/office-requests/admin-booking-date-range-ui";

type AdminDashboardPeriodFilterProps = {
  locale: string;
  dateRange: AdminBookingDateRange;
  customDateFrom?: string;
  customDateTo?: string;
};

const PRESETS: { id: AdminBookingDateRange; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "today", label: "اليوم" },
  { id: "yesterday", label: "أمس" },
  { id: "today_yesterday", label: "اليوم + أمس" },
];

export function AdminDashboardPeriodFilter({
  locale,
  dateRange,
  customDateFrom,
  customDateTo,
}: AdminDashboardPeriodFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const hasCustomRange = Boolean(customDateFrom || customDateTo);

  const buildHref = useCallback(
    (next: {
      range?: AdminBookingDateRange;
      from?: string | null;
      to?: string | null;
    }) => {
      const path = pathname.startsWith(`/${locale}`)
        ? pathname
        : `/${locale}/admin`;
      const params = new URLSearchParams(searchParams.toString());

      if (next.from === null) params.delete("from");
      else if (next.from) params.set("from", next.from);

      if (next.to === null) params.delete("to");
      else if (next.to) params.set("to", next.to);

      if (next.range !== undefined) {
        if (next.range === "all") {
          params.delete("range");
        } else {
          params.set("range", next.range);
        }
      }

      if (next.from || next.to) {
        params.delete("range");
      }

      const qs = params.toString();
      return qs ? `${path}?${qs}` : path;
    },
    [locale, pathname, searchParams],
  );

  function navigate(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  function onPreset(range: AdminBookingDateRange) {
    navigate(
      buildHref({
        range,
        from: null,
        to: null,
      }),
    );
  }

  function onDateChange(field: "from" | "to", value: string) {
    if (!value) return;
    navigate(
      buildHref({
        range: "all",
        from: field === "from" ? value : (customDateFrom ?? null),
        to: field === "to" ? value : (customDateTo ?? null),
      }),
    );
  }

  function onClearCustom() {
    navigate(
      buildHref({
        range: "all",
        from: null,
        to: null,
      }),
    );
  }

  return (
    <fieldset
      className="mt-4 w-full min-w-0 border-t border-gov-gray-100 pt-4"
      disabled={pending}
    >
      <legend className="mb-2 text-xs font-extrabold text-gov-navy">
        تاريخ الحجز (توقيت القاهرة)
      </legend>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <nav
          className={`${SEGMENT_TRAY} w-full shrink-0 sm:w-auto`}
          aria-label="فترة تاريخ الحجز"
        >
          {PRESETS.map((preset) => {
            const active = dateRange === preset.id && !hasCustomRange;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onPreset(preset.id)}
                className={segmentClass(active)}
                aria-current={active ? "true" : undefined}
              >
                {preset.label}
              </button>
            );
          })}
        </nav>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <label className="sr-only" htmlFor="dashboard-from-date">
            من
          </label>
          <input
            id="dashboard-from-date"
            type="date"
            value={customDateFrom ?? ""}
            onChange={(e) => onDateChange("from", e.target.value)}
            className={dateInputClass}
            aria-label="من تاريخ"
          />
          <label className="sr-only" htmlFor="dashboard-to-date">
            إلى
          </label>
          <input
            id="dashboard-to-date"
            type="date"
            value={customDateTo ?? ""}
            onChange={(e) => onDateChange("to", e.target.value)}
            className={dateInputClass}
            aria-label="إلى تاريخ"
          />
          {hasCustomRange ? (
            <button
              type="button"
              onClick={onClearCustom}
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-gov-gray-200 bg-white px-3 py-1.5 text-xs font-extrabold text-gov-navy transition hover:bg-gov-gray-50"
            >
              مسح
            </button>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
