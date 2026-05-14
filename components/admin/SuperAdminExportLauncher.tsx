"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  REQUEST_TYPE_LABELS,
  TRAVELER_CATEGORY_LABELS,
  type Office,
  type OfficeRequestType,
  type TravelerCategory,
} from "@/lib/office-requests/types";

const TRAVELER_KEYS: TravelerCategory[] = [
  "international",
  "hajj_umrah",
  "citizen",
];

type SuperAdminExportLauncherProps = {
  /** لمستخدم السوبر أدمن: قائمة المكاتب في القائمة المنسدلة */
  offices?: Office[];
  /** لمستخدم المكتب: إخفاء اختيار المكتب؛ الخادم يقيّد التصدير بمكتب الجلسة */
  lockedOfficeId?: string | null;
};

export function SuperAdminExportLauncher({
  offices = [],
  lockedOfficeId = null,
}: SuperAdminExportLauncherProps) {
  const [open, setOpen] = useState(false);
  const [typeBooking, setTypeBooking] = useState(true);
  const [typeComplaint, setTypeComplaint] = useState(true);
  const [typeProposal, setTypeProposal] = useState(true);
  const [traveler, setTraveler] = useState<Record<TravelerCategory, boolean>>({
    international: false,
    hajj_umrah: false,
    citizen: false,
  });
  const [uncategorized, setUncategorized] = useState(false);
  const [officeId, setOfficeId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOfficeScoped = Boolean(lockedOfficeId?.trim());

  const sortedOffices = useMemo(
    () => [...offices].sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar")),
    [offices],
  );

  const close = useCallback(() => {
    setOpen(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  async function handleDownload() {
    setError(null);
    const types: OfficeRequestType[] = [];
    if (typeBooking) types.push("booking");
    if (typeComplaint) types.push("complaint");
    if (typeProposal) types.push("proposal");

    if (types.length === 0) {
      setError("اختر نوعاً واحداً على الأقل من أنواع الطلبات.");
      return;
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError("تاريخ «من» يجب أن يكون قبل أو يساوي تاريخ «إلى».");
      return;
    }

    const params = new URLSearchParams();
    if (types.length < 3) {
      params.set("types", types.join(","));
    }

    const travelerParts: string[] = TRAVELER_KEYS.filter((k) => traveler[k]);
    if (uncategorized) travelerParts.push("uncategorized");
    if (travelerParts.length > 0) {
      params.set("travelerCategories", travelerParts.join(","));
    }

    if (!isOfficeScoped && officeId.trim()) {
      params.set("officeId", officeId.trim());
    }

    if (dateFrom.trim()) {
      params.set("from", dateFrom.trim());
    }
    if (dateTo.trim()) {
      params.set("to", dateTo.trim());
    }

    const qs = params.toString();
    const url = `/api/admin/requests/export${qs ? `?${qs}` : ""}`;

    setLoading(true);
    try {
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 401) {
        setError("انتهت الجلسة أو غير مصرح. سجّل الدخول من جديد.");
        return;
      }
      if (res.status === 403) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "غير مصرح بتنفيذ هذا التصدير.");
        return;
      }
      if (res.status === 400) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "طلب غير صالح.");
        return;
      }
      if (!res.ok) {
        setError("تعذر إنشاء الملف. حاول مرة أخرى.");
        return;
      }

      const blob = await res.blob();
      const capped = res.headers.get("X-Export-Capped") === "true";
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `requests-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

      if (capped) {
        setError(
          "تم التصدير لكن وُصل للحد الأقصى لعدد الصفوف في الملف — قد يكون هناك المزيد في قاعدة البيانات.",
        );
      } else {
        close();
      }
    } catch {
      setError("تعذر تنزيل الملف. تحقق من الاتصال وحاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
        className="inline-flex min-h-10 items-center justify-center rounded-md bg-gov-navy px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-gov-navy/90"
      >
        تصدير Excel
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="presentation"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-modal-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-gov-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-gov-gray-100 pb-3">
              <h2
                id="export-modal-title"
                className="font-heading text-lg font-bold text-gov-navy"
              >
                تصدير Excel للطلبات
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-md px-2 py-1 text-sm font-bold text-gov-gray-600 transition hover:bg-gov-gray-100"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <p className="mt-3 text-sm text-gov-gray-600">
              اختر ما يُدرج في الملف ثم اضغط تنزيل. التصفية على فئة المسافر
              تؤثر على <strong>الحجوزات</strong> فقط. التواريخ حسب{" "}
              <strong>توقيت مصر (UTC+2)</strong>.
              {isOfficeScoped ? (
                <>
                  {" "}
                  <strong>التصدير لمكتبك فقط.</strong>
                </>
              ) : null}
            </p>

            <div className="mt-5 space-y-5">
              <fieldset>
                <legend className="text-xs font-bold uppercase text-gov-gray-600">
                  الفترة (اختياري)
                </legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="export-from"
                      className="block text-xs font-bold text-gov-gray-600"
                    >
                      من تاريخ
                    </label>
                    <input
                      id="export-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gov-gray-200 px-3 py-2 text-sm font-semibold text-gov-navy"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="export-to"
                      className="block text-xs font-bold text-gov-gray-600"
                    >
                      إلى تاريخ
                    </label>
                    <input
                      id="export-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gov-gray-200 px-3 py-2 text-sm font-semibold text-gov-navy"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-xs font-bold uppercase text-gov-gray-600">
                  أنواع الطلبات
                </legend>
                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-gov-navy">
                    <input
                      type="checkbox"
                      checked={typeBooking}
                      onChange={(e) => setTypeBooking(e.target.checked)}
                      className="size-4 rounded border-gov-gray-300"
                    />
                    {REQUEST_TYPE_LABELS.booking}
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-gov-navy">
                    <input
                      type="checkbox"
                      checked={typeComplaint}
                      onChange={(e) => setTypeComplaint(e.target.checked)}
                      className="size-4 rounded border-gov-gray-300"
                    />
                    {REQUEST_TYPE_LABELS.complaint}
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-gov-navy">
                    <input
                      type="checkbox"
                      checked={typeProposal}
                      onChange={(e) => setTypeProposal(e.target.checked)}
                      className="size-4 rounded border-gov-gray-300"
                    />
                    {REQUEST_TYPE_LABELS.proposal}
                  </label>
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-xs font-bold uppercase text-gov-gray-600">
                  فئة المسافر (للحجوزات — اختياري)
                </legend>
                <p className="mt-1 text-xs text-gov-gray-500">
                  إن لم تختر أي فئة، يُصدَّر كل الحجوزات المطابقة لأنواع الطلبات
                  أعلاه.
                </p>
                <div className="mt-2 flex flex-wrap gap-4">
                  {TRAVELER_KEYS.map((key) => (
                    <label
                      key={key}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gov-navy"
                    >
                      <input
                        type="checkbox"
                        checked={traveler[key]}
                        onChange={(e) =>
                          setTraveler((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                        className="size-4 rounded border-gov-gray-300"
                      />
                      {TRAVELER_CATEGORY_LABELS[key]}
                    </label>
                  ))}
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-gov-navy">
                    <input
                      type="checkbox"
                      checked={uncategorized}
                      onChange={(e) => setUncategorized(e.target.checked)}
                      className="size-4 rounded border-gov-gray-300"
                    />
                    حجوزات بدون فئة مسافر
                  </label>
                </div>
              </fieldset>

              {!isOfficeScoped ? (
                <div>
                  <label
                    htmlFor="export-office"
                    className="text-xs font-bold uppercase text-gov-gray-600"
                  >
                    المكتب
                  </label>
                  <select
                    id="export-office"
                    value={officeId}
                    onChange={(e) => setOfficeId(e.target.value)}
                    className="mt-2 block w-full rounded-md border border-gov-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gov-navy shadow-sm focus:border-gov-accent focus:outline-none focus:ring-1 focus:ring-gov-accent"
                  >
                    <option value="">كل المكاتب</option>
                    {sortedOffices.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            {error ? (
              <p
                className={`mt-4 text-sm font-semibold ${
                  error.includes("تم التصدير")
                    ? "text-amber-800"
                    : "text-red-700"
                }`}
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2 border-t border-gov-gray-100 pt-4">
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={loading}
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-gov-navy px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-gov-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "جاري التجهيز…" : "تنزيل Excel"}
              </button>
              <button
                type="button"
                onClick={close}
                disabled={loading}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-200 px-4 py-2 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50 disabled:opacity-60"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
