"use client";

import { useCallback, useMemo, useState } from "react";
import {
  SUPER_ADMIN_EXPORT_MAX_ROWS,
  SUPER_ADMIN_IMPORT_MAX_DOCS,
  SUPER_ADMIN_PURGE_MAX_DOCS_PER_CALL,
} from "@/lib/office-requests/export-limits";
import {
  EXPORT_FILE_STEM_AR,
  SUPER_ADMIN_PURGE_CONFIRM_PHRASE,
  type SuperAdminDataCollectionKey,
  type SuperAdminPurgeOperationId,
} from "@/lib/office-requests/super-admin-data-constants";

const DATA_SCOPE_LABELS: Record<SuperAdminDataCollectionKey, string> = {
  requests: "الطلبات (حجوزات وشكاوى ومقترحات)",
  activityLogs: "سجل الإجراءات",
  offices: "بيانات المكاتب",
  messageTemplates: "قوالب رسائل واتساب",
};

const PURGE_TARGET_LABELS: Record<SuperAdminPurgeOperationId, string> = {
  activity_log: "سجل الإجراءات بالكامل",
  requests_all: "كل الطلبات",
  requests_complaints: "الشكاوى فقط",
  requests_proposals: "المقترحات فقط",
};

const PURGE_OPERATION_ORDER: SuperAdminPurgeOperationId[] = [
  "activity_log",
  "requests_all",
  "requests_complaints",
  "requests_proposals",
];

export function SuperAdminDataToolsPanel() {
  const [exportCollection, setExportCollection] =
    useState<SuperAdminDataCollectionKey>("requests");
  const [importCollection, setImportCollection] =
    useState<SuperAdminDataCollectionKey>("requests");
  const [importFormat, setImportFormat] = useState<"ndjson" | "json">("ndjson");
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importPayload, setImportPayload] = useState<string>("");
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const [purgeOperation, setPurgeOperation] =
    useState<SuperAdminPurgeOperationId>("requests_complaints");
  const [purgeConfirm, setPurgeConfirm] = useState("");
  const [purgeBusy, setPurgeBusy] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);

  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const requiredPurgePhrase = useMemo(
    () => SUPER_ADMIN_PURGE_CONFIRM_PHRASE[purgeOperation],
    [purgeOperation],
  );

  const downloadExport = useCallback(async () => {
    setExportError(null);
    setExportBusy(true);
    try {
      const params = new URLSearchParams({
        collection: exportCollection,
        limit: String(SUPER_ADMIN_EXPORT_MAX_ROWS),
      });
      const res = await fetch(
        `/api/admin/firestore/collection-export?${params.toString()}`,
        { method: "GET", credentials: "include" },
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? "تعذّر إتمام التصدير.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStamp = new Date().toISOString().slice(0, 10);
      a.download = `${EXPORT_FILE_STEM_AR[exportCollection]}-${dateStamp}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "تعذّر إتمام التصدير.");
    } finally {
      setExportBusy(false);
    }
  }, [exportCollection]);

  const runImport = useCallback(async () => {
    setImportResult(null);
    setImportBusy(true);
    try {
      const res = await fetch("/api/admin/firestore/collection-import", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection: importCollection,
          format: importFormat,
          payload: importPayload,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        written?: number;
        errors?: string[];
      };
      if (!res.ok) {
        throw new Error(data.error ?? "تعذّر إتمام الاستيراد.");
      }
      const errs = data.errors?.length
        ? `\nملاحظات:\n${data.errors.slice(0, 15).join("\n")}${data.errors.length > 15 ? "\n…" : ""}`
        : "";
      setImportResult(`تم حفظ ${data.written ?? 0} وثيقة.${errs}`);
    } catch (e) {
      setImportResult(e instanceof Error ? e.message : "تعذّر إتمام الاستيراد.");
    } finally {
      setImportBusy(false);
    }
  }, [importCollection, importFormat, importPayload]);

  const runPurge = useCallback(async () => {
    setPurgeResult(null);
    setPurgeBusy(true);
    try {
      const res = await fetch("/api/admin/firestore/collection-purge", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: purgeOperation,
          confirm: purgeConfirm.trim(),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        deleted?: number;
        truncated?: boolean;
        maxPerCall?: number;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "تعذّر إتمام الحذف الجماعي.");
      }
      const more =
        data.truncated === true
          ? ` — ما زالت هناك بيانات؛ أعد العملية حتى يصبح العدد صفراً (حد أقصى ${data.maxPerCall ?? SUPER_ADMIN_PURGE_MAX_DOCS_PER_CALL} في كل مرة).`
          : "";
      setPurgeResult(`تم حذف ${data.deleted ?? 0} سجلاً.${more}`);
      setPurgeConfirm("");
    } catch (e) {
      setPurgeResult(
        e instanceof Error ? e.message : "تعذّر إتمام الحذف الجماعي.",
      );
    } finally {
      setPurgeBusy(false);
    }
  }, [purgeOperation, purgeConfirm]);

  return (
    <div className="space-y-10 rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
      <header>
        <h2 className="text-lg font-extrabold text-gov-navy">
          النسخ الاحتياطي والاستعادة
        </h2>
        <p className="mt-2 text-sm text-gov-gray-600">
          للبيانات الكبيرة جداً يُفضَّل الاعتماد على أدوات النسخ الرسمية من
          مزوّد الخدمة.
        </p>
      </header>

      <section className="border-t border-gov-gray-100 pt-6">
        <h3 className="text-base font-bold text-gov-navy">تنزيل نسخة احتياطية</h3>
        <p className="mt-2 text-sm text-gov-gray-600">
          ملف نصي منظم، حتى{" "}
          <strong>{SUPER_ADMIN_EXPORT_MAX_ROWS.toLocaleString("ar-EG")}</strong>{" "}
          وثيقة في كل تنزيل.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm font-bold text-gov-navy">
            نطاق البيانات
            <select
              value={exportCollection}
              onChange={(e) =>
                setExportCollection(e.target.value as SuperAdminDataCollectionKey)
              }
              className="mt-1 block min-w-[16rem] rounded-md border border-gov-gray-200 bg-white px-3 py-2 text-sm"
            >
              {(Object.keys(DATA_SCOPE_LABELS) as SuperAdminDataCollectionKey[]).map(
                (key) => (
                  <option key={key} value={key}>
                    {DATA_SCOPE_LABELS[key]}
                  </option>
                ),
              )}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void downloadExport()}
            disabled={exportBusy}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-gov-navy px-4 py-2 text-sm font-bold text-white transition hover:bg-gov-accent disabled:opacity-50"
          >
            {exportBusy ? "جاري التجهيز…" : "تنزيل الملف"}
          </button>
        </div>
        {exportError ? (
          <p className="mt-3 text-sm font-semibold text-red-700">{exportError}</p>
        ) : null}
      </section>

      <section className="border-t border-gov-gray-100 pt-6">
        <h3 className="text-base font-bold text-gov-navy">استعادة من ملف</h3>
        <p className="mt-2 text-sm text-gov-gray-600">
          إما سطر لكل وثيقة، أو قائمة واحدة من البنود؛ كل بند يحوي رمز الوثيقة
          ومحتواها. عند اختيار «الطلبات» يُتحقق من الحقول الأساسية. حد أقصى{" "}
          <strong>{SUPER_ADMIN_IMPORT_MAX_DOCS.toLocaleString("ar-EG")}</strong>{" "}
          وثيقة في كل عملية.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="text-sm font-bold text-gov-navy">
            نطاق البيانات
            <select
              value={importCollection}
              onChange={(e) =>
                setImportCollection(e.target.value as SuperAdminDataCollectionKey)
              }
              className="mt-1 block min-w-[16rem] rounded-md border border-gov-gray-200 bg-white px-3 py-2 text-sm"
            >
              {(Object.keys(DATA_SCOPE_LABELS) as SuperAdminDataCollectionKey[]).map(
                (key) => (
                  <option key={key} value={key}>
                    {DATA_SCOPE_LABELS[key]}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="text-sm font-bold text-gov-navy">
            شكل الملف
            <select
              value={importFormat}
              onChange={(e) =>
                setImportFormat(e.target.value === "json" ? "json" : "ndjson")
              }
              className="mt-1 block min-w-[12rem] rounded-md border border-gov-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="ndjson">سطر لكل وثيقة</option>
              <option value="json">قائمة واحدة من البنود</option>
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm font-bold text-gov-navy">
          ارفع ملفاً نصّياً أو الصق المحتوى هنا
          <input
            type="file"
            accept=".txt,.json,text/plain,application/json"
            className="mt-2 block w-full max-w-xl text-sm"
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              if (!f) return;
              setImportFileName(f.name);
              const reader = new FileReader();
              reader.onload = () => {
                setImportPayload(String(reader.result ?? ""));
              };
              reader.readAsText(f, "UTF-8");
            }}
          />
          {importFileName ? (
            <span className="mt-1 block text-xs text-gov-gray-500">
              الملف المختار: {importFileName}
            </span>
          ) : null}
        </label>
        <textarea
          value={importPayload}
          onChange={(e) => setImportPayload(e.target.value)}
          rows={8}
          className="mt-3 w-full max-w-3xl rounded-md border border-gov-gray-200 bg-gov-gray-50 p-3 font-mono text-xs text-gov-navy"
          placeholder="الصق هنا محتوى النسخة الاحتياطية كما ورد من التصدير."
        />
        <button
          type="button"
          onClick={() => void runImport()}
          disabled={importBusy || !importPayload.trim()}
          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md border border-gov-accent bg-gov-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-gov-navy disabled:opacity-50"
        >
          {importBusy ? "جاري الحفظ…" : "تنفيذ الاستعادة"}
        </button>
        {importResult ? (
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-gov-gray-200 bg-gov-gray-50 p-3 text-xs text-gov-navy">
            {importResult}
          </pre>
        ) : null}
      </section>

      <section className="border-t border-gov-gray-100 pt-6">
        <h3 className="text-base font-bold text-red-900">حذف جماعي</h3>
        <p className="mt-2 text-sm text-red-900/90">
          حذف دفعات من السجلات المختارة. في كل مرة يُحذف على الأكثر{" "}
          <strong>
            {SUPER_ADMIN_PURGE_MAX_DOCS_PER_CALL.toLocaleString("ar-EG")}
          </strong>{" "}
          سجلاً — كرر العملية إذا بقي عدد كبير.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="text-sm font-bold text-gov-navy">
            ماذا تريد حذفه؟
            <select
              value={purgeOperation}
              onChange={(e) => {
                const v = e.target.value as SuperAdminPurgeOperationId;
                setPurgeOperation(v);
                setPurgeConfirm("");
              }}
              className="mt-1 block min-w-[18rem] rounded-md border border-gov-gray-200 bg-white px-3 py-2 text-sm"
            >
              {PURGE_OPERATION_ORDER.map((id) => (
                <option key={id} value={id}>
                  {PURGE_TARGET_LABELS[id]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-4 text-sm font-bold text-gov-navy">
          انسخ الجملة التالية حرفياً في مربع التأكيد:
        </p>
        <p className="mt-2 rounded-md border border-gov-gray-200 bg-gov-gray-50 px-3 py-2 text-sm font-semibold text-gov-navy">
          {requiredPurgePhrase}
        </p>
        <label className="mt-4 block text-sm font-bold text-gov-navy">
          جملة التأكيد
          <input
            value={purgeConfirm}
            onChange={(e) => setPurgeConfirm(e.target.value)}
            className="mt-2 block w-full max-w-2xl rounded-md border border-red-200 bg-white px-3 py-2 text-sm"
            autoComplete="off"
            placeholder=""
          />
        </label>
        <button
          type="button"
          onClick={() => void runPurge()}
          disabled={
            purgeBusy || purgeConfirm.trim() !== requiredPurgePhrase
          }
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md border border-red-800 bg-red-800 px-4 py-2 text-sm font-bold text-white transition enabled:hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {purgeBusy ? "جاري الحذف…" : "تنفيذ الحذف الجماعي"}
        </button>
        {purgeResult ? (
          <p className="mt-3 text-sm font-semibold text-gov-navy">{purgeResult}</p>
        ) : null}
      </section>
    </div>
  );
}
