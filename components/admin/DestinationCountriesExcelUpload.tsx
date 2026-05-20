"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { feedbackToast } from "@/lib/ui/feedback-toast";
import type { DestinationCountryImportPreview } from "@/lib/office-requests/destination-countries-import";
import type { DestinationCountryImportResult } from "@/lib/office-requests/types";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function countryLabel(nameEn: string, nameAr: string): string {
  return `${nameEn} - ${nameAr}`;
}

type Phase = "idle" | "preview" | "saving";

function PreviewTable({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="rounded-md border border-gov-gray-200 bg-white"
    >
      <summary className="cursor-pointer px-3 py-2 text-sm font-bold text-gov-navy">
        {title}
      </summary>
      <div className="border-t border-gov-gray-100 px-1 pb-2">{children}</div>
    </details>
  );
}

export function DestinationCountriesExcelUpload() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<DestinationCountryImportPreview | null>(
    null,
  );
  const canSave =
    preview != null && preview.summary.create + preview.summary.update > 0;

  const reset = useCallback(() => {
    setFileName(null);
    setFileBase64(null);
    setPreview(null);
    setPhase("idle");
  }, []);

  const downloadXlsx = useCallback(async (url: string, fallbackName: string) => {
    const res = await fetch(url, {
      headers: { "X-CQM-Admin-Request": "1" },
    });
    if (!res.ok) {
      throw new Error("تعذّر التحميل.");
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const quoted = disposition.match(/filename="([^"]+)"/i)?.[1];
    a.download =
      (utf8 ? decodeURIComponent(utf8) : quoted) ?? fallbackName;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }, []);

  const downloadTemplate = useCallback(async () => {
    try {
      await downloadXlsx(
        "/api/admin/destination-countries/template",
        "destination-countries-template.xlsx",
      );
    } catch (err) {
      feedbackToast.error(
        err instanceof Error ? err.message : "تعذّر تحميل القالب.",
      );
    }
  }, []);

  const runPreview = useCallback(async (base64: string, name: string) => {
    setPhase("preview");
    setPreview(null);

    const res = await fetch("/api/admin/destination-countries/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CQM-Admin-Request": "1",
      },
      body: JSON.stringify({ fileBase64: base64 }),
    });

    const data = (await res.json()) as {
      preview?: DestinationCountryImportPreview;
      error?: string;
    };

    if (!res.ok) {
      if (data.preview) {
        setPreview(data.preview);
        setFileName(name);
        setFileBase64(base64);
        throw new Error(data.error ?? "تعذّرت معاينة الملف.");
      }
      throw new Error(data.error ?? "تعذّرت معاينة الملف.");
    }

    if (!data.preview) {
      throw new Error("لم تُرجَع معاينة.");
    }

    setPreview(data.preview);
    setFileName(name);
    setFileBase64(base64);
  }, [downloadXlsx]);

  const downloadExport = useCallback(async () => {
    try {
      await downloadXlsx(
        "/api/admin/destination-countries/export",
        "destination-countries-export.xlsx",
      );
      feedbackToast.success("تم تنزيل ملف Excel الحالي.");
    } catch (err) {
      feedbackToast.error(
        err instanceof Error ? err.message : "تعذّر تصدير الملف.",
      );
    }
  }, [downloadXlsx]);

  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      setPhase("preview");
      try {
        const buffer = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        await runPreview(base64, file.name);
      } catch (err) {
        feedbackToast.error(
          err instanceof Error ? err.message : "تعذّرت معاينة الملف.",
        );
        reset();
      }
    },
    [reset, runPreview],
  );

  const onConfirmSave = useCallback(async () => {
    if (!fileBase64 || !canSave) return;

    setPhase("saving");
    try {
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
        throw new Error(data.error ?? "فشل الحفظ.");
      }

      const summary =
        data.mode === "bootstrap"
          ? `تم إنشاء ${data.created} دولة.`
          : `تم تحديث ${data.updated} دولة.`;
      feedbackToast.success(summary);
      router.refresh();
      reset();
    } catch (err) {
      feedbackToast.error(
        err instanceof Error ? err.message : "فشل الحفظ.",
      );
      setPhase("preview");
    }
  }, [canSave, fileBase64, reset, router]);

  return (
    <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-extrabold text-gov-navy">رفع ملف Excel</h2>
      <p className="mt-2 text-sm text-gov-gray-600">
        العمودان: <strong>اسم الدولة</strong> (مثل{" "}
        <span dir="ltr" className="font-mono text-xs">
          EGYPT - مصر
        </span>
        ) و<strong>متطلبات التطعيم</strong>. اختر الملف لمعاينة التغييرات قبل
        الحفظ.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void downloadExport()}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-gov-navy bg-gov-navy px-4 py-2 text-sm font-bold text-white transition hover:bg-gov-navy/90"
        >
          تصدير Excel الحالي
        </button>
        <button
          type="button"
          onClick={() => void downloadTemplate()}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-300 bg-white px-4 py-2 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50"
        >
          تحميل قالب Excel
        </button>
        <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md bg-gov-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-gov-navy has-disabled:opacity-60">
          {phase === "preview" && !preview
            ? "جاري المعاينة…"
            : "اختيار ملف للمعاينة"}
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            disabled={phase === "saving"}
            onChange={(e) => void onFileChange(e)}
          />
        </label>
        {preview ? (
          <>
            <button
              type="button"
              disabled={!canSave || phase === "saving"}
              onClick={() => void onConfirmSave()}
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-gov-navy px-4 py-2 text-sm font-bold text-white transition hover:bg-gov-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {phase === "saving" ? "جاري الحفظ…" : "حفظ التغييرات"}
            </button>
            <button
              type="button"
              disabled={phase === "saving"}
              onClick={reset}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-300 bg-white px-4 py-2 text-sm font-bold text-gov-gray-700 transition hover:bg-gov-gray-50"
            >
              إلغاء
            </button>
          </>
        ) : null}
      </div>

      {fileName && phase !== "idle" ? (
        <p className="mt-3 text-xs text-gov-gray-600">الملف: {fileName}</p>
      ) : null}

      {preview ? (
        <div className="mt-4 space-y-3" role="region" aria-label="معاينة الاستيراد">
          <div className="rounded-md border border-gov-accent/30 bg-gov-accent/5 px-4 py-3 text-sm text-gov-navy">
            <p className="font-bold">
              {preview.mode === "bootstrap" ? "استيراد أولي" : "تحديث المتطلبات"}
            </p>
            <p className="mt-1">
              جديد: {preview.summary.create} · سيُحدَّث: {preview.summary.update}{" "}
              · بدون تغيير: {preview.summary.unchanged} · أخطاء:{" "}
              {preview.summary.error}
            </p>
            {!canSave ? (
              <p className="mt-2 text-amber-900">
                لا توجد تغييرات قابلة للحفظ. صحّح الأخطاء أو عدّل المتطلبات.
              </p>
            ) : null}
          </div>

          {preview.creates.length > 0 ? (
            <PreviewTable
              title={`جديد (${preview.creates.length})`}
              defaultOpen
            >
              <div className="max-h-48 overflow-x-auto overflow-y-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-gov-gray-600">
                      <th className="px-3 py-2 text-start">الدولة</th>
                      <th className="px-3 py-2 text-start">متطلبات التطعيم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.creates.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-gov-gray-100"
                      >
                        <td className="px-3 py-2 font-medium text-gov-navy">
                          {countryLabel(row.nameEn, row.nameAr)}
                        </td>
                        <td className="px-3 py-2 text-gov-gray-800">
                          {row.newRequirementsAr}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PreviewTable>
          ) : null}

          {preview.updates.length > 0 ? (
            <PreviewTable
              title={`سيُحدَّث (${preview.updates.length})`}
              defaultOpen
            >
              <div className="max-h-56 overflow-x-auto overflow-y-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-gov-gray-600">
                      <th className="px-3 py-2 text-start">الدولة</th>
                      <th className="px-3 py-2 text-start">قبل</th>
                      <th className="px-3 py-2 text-start">بعد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.updates.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-gov-gray-100"
                      >
                        <td className="px-3 py-2 font-medium text-gov-navy">
                          {countryLabel(row.nameEn, row.nameAr)}
                        </td>
                        <td className="px-3 py-2 text-gov-gray-600 line-through decoration-gov-gray-400">
                          {row.currentRequirementsAr}
                        </td>
                        <td className="px-3 py-2 font-bold text-gov-navy">
                          {row.newRequirementsAr}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PreviewTable>
          ) : null}

          {preview.unchanged.length > 0 ? (
            <PreviewTable
              title={`بدون تغيير (${preview.unchanged.length})`}
              defaultOpen={false}
            >
              <div className="max-h-40 overflow-x-auto overflow-y-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-gov-gray-600">
                      <th className="px-3 py-2 text-start">الدولة</th>
                      <th className="px-3 py-2 text-start">المتطلبات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.unchanged.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-gov-gray-100"
                      >
                        <td className="px-3 py-2 text-gov-gray-700">
                          {countryLabel(row.nameEn, row.nameAr)}
                        </td>
                        <td className="px-3 py-2 text-gov-gray-600">
                          {row.currentRequirementsAr}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PreviewTable>
          ) : null}

          {preview.errors.length > 0 ? (
            <PreviewTable
              title={`أخطاء (${preview.errors.length})`}
              defaultOpen
            >
              <ul className="max-h-40 list-disc space-y-1 overflow-y-auto px-5 py-2 text-xs text-amber-900">
                {preview.errors.map((err, i) => (
                  <li key={`${err.message}-${i}`}>
                    {err.sortOrder != null ? `صف ${err.sortOrder}: ` : ""}
                    {err.message}
                  </li>
                ))}
              </ul>
            </PreviewTable>
          ) : null}
        </div>
      ) : null}

    </div>
  );
}
