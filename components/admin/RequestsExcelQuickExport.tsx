"use client";

import { useCallback, useMemo, useState } from "react";
import type { AdminRequestsStatusFilter } from "@/lib/office-requests/requests-list-params";
import { SUPER_ADMIN_EXPORT_MAX_ROWS } from "@/lib/office-requests/export-limits";
import {
  buildRequestsExcelExportUrl,
  downloadRequestsExcel,
} from "@/lib/office-requests/requests-excel-download";
import { feedbackToast } from "@/lib/ui/feedback-toast";

type RequestsExcelQuickExportProps = {
  status: AdminRequestsStatusFilter;
  bookingDateFrom?: string;
  bookingDateTo?: string;
  lockedOfficeId?: string | null;
};

export function RequestsExcelQuickExport({
  status,
  bookingDateFrom,
  bookingDateTo,
  lockedOfficeId = null,
}: RequestsExcelQuickExportProps) {
  const [loading, setLoading] = useState(false);

  const hasListFilters = useMemo(
    () =>
      status !== "all" ||
      Boolean(bookingDateFrom?.trim()) ||
      Boolean(bookingDateTo?.trim()),
    [status, bookingDateFrom, bookingDateTo],
  );

  const handleDownload = useCallback(async () => {
    const params = new URLSearchParams();
    if (status !== "all") {
      params.set("status", status);
    }
    const from = bookingDateFrom?.trim();
    const to = bookingDateTo?.trim();
    if (from) params.set("bookingFrom", from);
    if (to) params.set("bookingTo", to);
    if (lockedOfficeId?.trim()) {
      params.set("officeId", lockedOfficeId.trim());
    }

    setLoading(true);
    try {
      const result = await downloadRequestsExcel(
        buildRequestsExcelExportUrl(params),
      );
      if (!result.ok) {
        feedbackToast.error(result.error);
        return;
      }
      let note = `تم تنزيل ${result.rowCount} صفاً.`;
      if (result.capped) {
        note += ` (الحد الأقصى ${SUPER_ADMIN_EXPORT_MAX_ROWS.toLocaleString("ar-EG")} صفاً — ضيّق التصفية إن لزم.)`;
      }
      feedbackToast.success(note);
    } finally {
      setLoading(false);
    }
  }, [status, bookingDateFrom, bookingDateTo, lockedOfficeId]);

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-gov-navy bg-gov-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gov-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "جاري التصدير…" : "تصدير Excel"}
      </button>
      {hasListFilters ? (
        <p className="max-w-xs text-end text-xs text-gov-gray-500">
          يطابق الحالة وتاريخ الحجز في الجدول أدناه.
        </p>
      ) : null}
    </div>
  );
}
