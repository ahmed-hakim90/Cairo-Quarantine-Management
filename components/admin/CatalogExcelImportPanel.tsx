"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import type { CatalogImportPreview } from "@/lib/office-requests/catalog-import-preview";
import type { CatalogExcelEntity } from "@/lib/office-requests/catalog-excel-admin";
import type { DestinationCountryImportResult } from "@/lib/office-requests/types";
import { feedbackToast } from "@/lib/ui/feedback-toast";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
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

type CatalogExcelImportPanelProps = {
  entity: CatalogExcelEntity;
  title: string;
  description: string;
  exportFileName: string;
  templateFileName: string;
};

function saveSuccessMessageForEntity(
  entity: CatalogExcelEntity,
  result: DestinationCountryImportResult & { mode?: string },
): string {
  const labels: Record<CatalogExcelEntity, [string, string]> = {
    offices: ["مكتب", "مكاتب"],
    vaccines: ["لقاح", "لقاحات"],
    templates: ["قالب", "قوالب"],
  };
  const [one, many] = labels[entity];
  if (result.mode === "bootstrap") {
    const n = result.created;
    return n === 1 ? `تم إنشاء ${n} ${one}.` : `تم إنشاء ${n} ${many}.`;
  }
  const n = result.updated;
  return n === 1 ? `تم تحديث ${n} ${one}.` : `تم تحديث ${n} ${many}.`;
}

export function CatalogExcelImportPanel({
  entity,
  title,
  description,
  exportFileName,
  templateFileName,
}: CatalogExcelImportPanelProps) {
  const router = useRouter();

  const base = `/api/admin/${entity}/excel`;
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<CatalogImportPreview | null>(null);

  const canSave =
    preview != null && preview.summary.create + preview.summary.update > 0;

  const reset = useCallback(() => {
    setFileName(null);
    setFileBase64(null);
    setPreview(null);
    setPhase("idle");
  }, []);

  const adminFetch = useCallback(
    (path: string, init?: RequestInit) =>
      fetch(path, {
        ...init,
        headers: {
          ...init?.headers,
          "X-CQM-Admin-Request": "1",
        },
      }),
    [],
  );

  const downloadBlob = useCallback(
    async (path: string, filename: string) => {
      const res = await adminFetch(path);
      if (!res.ok) throw new Error("تعذّر التحميل.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [adminFetch],
  );

  const runPreview = useCallback(
    async (base64: string, name: string) => {
      setPhase("preview");
      setPreview(null);

      const res = await adminFetch(`${base}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64: base64 }),
      });

      const data = (await res.json()) as {
        preview?: CatalogImportPreview;
        error?: string;
      };

      if (!res.ok) {
        if (data.preview) {
          setPreview(data.preview);
          setFileName(name);
          setFileBase64(base64);
        }
        throw new Error(data.error ?? "تعذّرت معاينة الملف.");
      }

      if (!data.preview) throw new Error("لم تُرجَع معاينة.");
      setPreview(data.preview);
      setFileName(name);
      setFileBase64(base64);
    },
    [adminFetch, base],
  );

  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      setPhase("preview");
      try {
        const base64 = arrayBufferToBase64(await file.arrayBuffer());
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
      const res = await adminFetch(`${base}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64 }),
      });
      const data = (await res.json()) as DestinationCountryImportResult & {
        mode?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ.");
      feedbackToast.success(saveSuccessMessageForEntity(entity, data));
      router.refresh();
      reset();
    } catch (err) {
      feedbackToast.error(
        err instanceof Error ? err.message : "فشل الحفظ.",
      );
      setPhase("preview");
    }
  }, [
    adminFetch,
    base,
    canSave,
    fileBase64,
    reset,
    router,
    entity,
  ]);

  return (
    <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-extrabold text-gov-navy">{title}</h2>
      <p className="mt-2 text-sm text-gov-gray-600">{description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void downloadBlob(`${base}/export`, exportFileName)}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-300 bg-white px-4 py-2 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50"
        >
          تصدير Excel الحالي
        </button>
        <button
          type="button"
          onClick={() => void downloadBlob(`${base}/template`, templateFileName)}
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
        <div
          className="mt-4 space-y-3"
          role="region"
          aria-label="معاينة الاستيراد"
        >
          <div className="rounded-md border border-gov-accent/30 bg-gov-accent/5 px-4 py-3 text-sm text-gov-navy">
            <p className="font-bold">
              {preview.mode === "bootstrap" ? "استيراد أولي" : "تحديث البيانات"}
            </p>
            <p className="mt-1">
              جديد: {preview.summary.create} · سيُحدَّث:{" "}
              {preview.summary.update} · بدون تغيير:{" "}
              {preview.summary.unchanged} · أخطاء: {preview.summary.error}
            </p>
            {!canSave ? (
              <p className="mt-2 text-amber-900">
                لا توجد تغييرات قابلة للحفظ. صحّح الأخطاء أو عدّل البيانات.
              </p>
            ) : null}
          </div>

          {preview.creates.length > 0 ? (
            <PreviewTable title={`جديد (${preview.creates.length})`}>
              <ul className="max-h-40 space-y-1 overflow-y-auto px-3 py-2 text-xs">
                {preview.creates.map((row) => (
                  <li key={row.id} className="text-gov-navy">
                    {row.label}
                  </li>
                ))}
              </ul>
            </PreviewTable>
          ) : null}

          {preview.updates.length > 0 ? (
            <PreviewTable title={`سيُحدَّث (${preview.updates.length})`}>
              <ul className="max-h-56 space-y-2 overflow-y-auto px-3 py-2 text-xs">
                {preview.updates.map((row) => (
                  <li key={row.id} className="border-t border-gov-gray-100 pt-2 first:border-0 first:pt-0">
                    <p className="font-bold text-gov-navy">{row.label}</p>
                    <ul className="mt-1 space-y-0.5 text-gov-gray-700">
                      {row.changes?.map((c) => (
                        <li key={c.field}>
                          <span className="font-medium">{c.labelAr}:</span>{" "}
                          <span className="text-gov-gray-500 line-through">
                            {c.before || "—"}
                          </span>{" "}
                          ←{" "}
                          <span className="font-bold text-gov-navy">
                            {c.after || "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </PreviewTable>
          ) : null}

          {preview.unchanged.length > 0 ? (
            <PreviewTable
              title={`بدون تغيير (${preview.unchanged.length})`}
              defaultOpen={false}
            >
              <ul className="max-h-32 space-y-1 overflow-y-auto px-3 py-2 text-xs text-gov-gray-600">
                {preview.unchanged.map((row) => (
                  <li key={row.id}>{row.label}</li>
                ))}
              </ul>
            </PreviewTable>
          ) : null}

          {preview.errors.length > 0 ? (
            <PreviewTable title={`أخطاء (${preview.errors.length})`}>
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
