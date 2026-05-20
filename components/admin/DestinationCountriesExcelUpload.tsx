"use client";

import { useCallback, useState } from "react";
import { feedbackToast } from "@/lib/ui/feedback-toast";
import type { DestinationCountryImportResult } from "@/lib/office-requests/types";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function DestinationCountriesExcelUpload() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<
    (DestinationCountryImportResult & { mode?: string }) | null
  >(null);

  const downloadTemplate = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/destination-countries/template", {
        headers: { "X-CQM-Admin-Request": "1" },
      });
      if (!res.ok) {
        throw new Error("تعذّر تحميل القالب.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "destination-countries-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
        feedbackToast.error(
          err instanceof Error ? err.message : "تعذّر تحميل القالب.",
        );
    }
  }, []);

  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      setFileName(file.name);
      setResult(null);
      setBusy(true);

      try {
        const buffer = await file.arrayBuffer();
        const fileBase64 = arrayBufferToBase64(buffer);

        const res = await fetch("/api/admin/destination-countries/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CQM-Admin-Request": "1",
          },
          body: JSON.stringify({ fileBase64 }),
        });

        const data = (await res.json()) as DestinationCountryImportResult & {
          mode?: string;
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error ?? "فشل رفع الملف.");
        }

        setResult(data);
        const summary =
          data.mode === "bootstrap"
            ? `تم إنشاء ${data.created} دولة.`
            : `تم تحديث ${data.updated} دولة.`;
        const warn =
          data.skipped > 0 || data.errors.length > 0
            ? " راجع التفاصيل أدناه."
            : "";
        feedbackToast.success(summary + warn);
      } catch (err) {
        feedbackToast.error(
          err instanceof Error ? err.message : "فشل رفع الملف.",
        );
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return (
    <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-extrabold text-gov-navy">رفع ملف Excel</h2>
      <p className="mt-2 text-sm text-gov-gray-600">
        العمودان: <strong>اسم الدولة</strong> (مثل{" "}
        <span dir="ltr" className="font-mono text-xs">
          EGYPT - مصر
        </span>
        ) و<strong>متطلبات التطعيم</strong>. أول رفع يملأ القائمة؛ إعادة الرفع
        تحدّث المتطلبات فقط دون تغيير أسماء الدول.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void downloadTemplate()}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-300 bg-white px-4 py-2 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50"
        >
          تحميل قالب Excel
        </button>
        <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md bg-gov-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-gov-navy has-disabled:opacity-60">
          {busy ? "جاري الرفع…" : "رفع ملف .xlsx"}
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            disabled={busy}
            onChange={(e) => void onFileChange(e)}
          />
        </label>
      </div>

      {fileName ? (
        <p className="mt-3 text-xs text-gov-gray-600">آخر ملف: {fileName}</p>
      ) : null}

      {result ? (
        <div
          className="mt-4 rounded-md border border-gov-gray-200 bg-gov-gray-50 p-3 text-sm text-gov-gray-800"
          role="status"
        >
          <p>
            {result.mode === "bootstrap" ? "استيراد أولي" : "تحديث المتطلبات"} —
            أُنشئ: {result.created} · حُدّث: {result.updated} · تُخطّى:{" "}
            {result.skipped}
          </p>
          {result.errors.length > 0 ? (
            <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto ps-5 text-xs text-amber-900">
              {result.errors.slice(0, 30).map((err) => (
                <li key={err}>{err}</li>
              ))}
              {result.errors.length > 30 ? (
                <li>… و{result.errors.length - 30} رسالة أخرى</li>
              ) : null}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
