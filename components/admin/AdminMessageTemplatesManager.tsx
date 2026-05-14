"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  deleteTemplateAction,
  saveTemplateAction,
} from "@/app/[locale]/admin/actions";
import type { MessageTemplate } from "@/lib/office-requests/types";

const fieldClass =
  "mt-1 w-full rounded-md border border-gov-gray-200 bg-white px-3 py-2.5 text-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/20";

type AdminMessageTemplatesManagerProps = {
  locale: string;
  templates: MessageTemplate[];
};

export function AdminMessageTemplatesManager({
  locale,
  templates,
}: AdminMessageTemplatesManagerProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"new" | "edit" | null>(null);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);

  function openNew() {
    setMode("new");
    setEditing(null);
    dialogRef.current?.showModal();
  }

  function openEdit(template: MessageTemplate) {
    setMode("edit");
    setEditing(template);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setMode(null);
    setEditing(null);
  }

  return (
    <div className="rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-lg font-bold text-gov-navy">
          قوالب واتساب
        </h2>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-gov-accent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gov-navy"
        >
          قالب جديد
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-gov-gray-600">
        المتغيرات في النص: {"{name}"} {"{officeName}"} {"{officeAddress}"}{" "}
        {"{officeMapUrl}"} {"{phone}"} {"{requestType}"} {"{requestDetails}"}
      </p>

      {templates.length === 0 ? (
        <p className="mt-4 text-sm text-gov-gray-600">لا توجد قوالب بعد.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-gov-gray-200">
          <table className="min-w-full divide-y divide-gov-gray-200 text-sm">
            <thead className="bg-gov-gray-50">
              <tr>
                <th className="px-3 py-2 text-start font-bold text-gov-navy">
                  العنوان
                </th>
                <th className="px-3 py-2 text-start font-bold text-gov-navy">
                  مقتطف
                </th>
                <th className="px-3 py-2 text-start font-bold text-gov-navy">
                  مفعّل
                </th>
                <th className="px-3 py-2 text-start font-bold text-gov-navy">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-gray-200 bg-white">
              {templates.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 font-bold text-gov-navy">
                    {row.title}
                  </td>
                  <td className="max-w-[14rem] truncate px-3 py-2 text-gov-gray-600">
                    {row.body.replace(/\s+/g, " ").slice(0, 72)}
                    {row.body.length > 72 ? "…" : ""}
                  </td>
                  <td className="px-3 py-2">
                    {row.active ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
                        نعم
                      </span>
                    ) : (
                      <span className="rounded-md bg-gov-gray-100 px-2 py-1 text-xs font-bold text-gov-gray-600">
                        لا
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="rounded-md border border-gov-gray-200 px-2 py-1 text-xs font-bold text-gov-navy hover:bg-gov-gray-50"
                      >
                        تعديل
                      </button>
                      <form
                        className="inline"
                        action={async (formData) => {
                          if (
                            typeof window !== "undefined" &&
                            !window.confirm("حذف هذا القالب؟ لا يمكن التراجع.")
                          ) {
                            return;
                          }
                          await deleteTemplateAction(formData);
                          router.refresh();
                        }}
                      >
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="id" value={row.id} />
                        <button
                          type="submit"
                          disabled={row.id === "default"}
                          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-800 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                          title={
                            row.id === "default"
                              ? "القالب الافتراضي لا يُحذف من هنا"
                              : undefined
                          }
                        >
                          حذف
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[90vh] w-[min(100%,36rem)] max-w-[calc(100%-2rem)] overflow-y-auto rounded-lg border border-gov-gray-200 bg-white p-0 shadow-xl backdrop:bg-black/40"
        dir="rtl"
        aria-labelledby="template-dialog-title"
        onClose={closeDialog}
      >
        <div className="border-b border-gov-gray-200 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <h2
              id="template-dialog-title"
              className="font-heading text-lg font-extrabold text-gov-navy"
            >
              {mode === "new" ? "قالب جديد" : "تعديل القالب"}
            </h2>
            <button
              type="button"
              className="rounded-md border border-gov-gray-200 px-2 py-1 text-xs font-bold text-gov-navy hover:bg-gov-gray-50"
              onClick={closeDialog}
            >
              إغلاق
            </button>
          </div>
        </div>
        <div className="px-4 py-4">
          <form
            className="space-y-3"
            action={async (formData) => {
              await saveTemplateAction(formData);
              router.refresh();
              closeDialog();
            }}
          >
            <input type="hidden" name="locale" value={locale} />
            <input
              type="hidden"
              name="id"
              value={mode === "new" ? "new" : (editing?.id ?? "new")}
            />
            <label className="block text-sm font-bold text-gov-navy">
              العنوان
              <input
                name="title"
                required
                defaultValue={editing?.title ?? ""}
                className={fieldClass}
                placeholder="مثال: متابعة حجز"
              />
            </label>
            <label className="block text-sm font-bold text-gov-navy">
              نص الرسالة
              <textarea
                name="body"
                required
                rows={10}
                defaultValue={editing?.body ?? ""}
                className={fieldClass}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-gov-navy">
              <input
                name="active"
                type="checkbox"
                defaultChecked={mode === "new" ? true : editing?.active !== false}
              />
              مفعّل (يظهر للمكاتب عند إرسال واتساب)
            </label>
            <button
              type="submit"
              className="w-full rounded-md bg-gov-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-gov-navy"
            >
              حفظ
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
}
