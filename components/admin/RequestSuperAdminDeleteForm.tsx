"use client";

import { useState, useTransition } from "react";
import { deleteRequestSuperAdminAction } from "@/app/[locale]/admin/actions";
import { runWithFeedback } from "@/lib/ui/run-with-feedback";

type RequestSuperAdminDeleteFormProps = {
  locale: string;
  requestId: string;
  requestName: string;
};

export function RequestSuperAdminDeleteForm({
  locale,
  requestId,
  requestName,
}: RequestSuperAdminDeleteFormProps) {
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-md border border-red-200 bg-red-50/80 p-4">
      <h3 className="text-sm font-extrabold text-red-950">حذف نهائي</h3>
      <p className="mt-2 text-sm leading-relaxed text-red-900">
        سيتم إزالة هذا الطلب من النظام ولن يُسجَّل ذلك كإجراء جديد في سجل
        المتابعة. لا يمكن التراجع بعد التنفيذ.
      </p>
      <p className="mt-2 text-xs font-semibold text-red-950">
        صاحب الطلب: {requestName}
        <br />
        <span className="text-gov-gray-700">رمز التأكيد المطلوب نسخه:</span>{" "}
        <span className="rounded bg-white px-1.5 py-0.5 font-mono text-xs tracking-tight text-gov-navy">
          {requestId}
        </span>
      </p>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => {
            void runWithFeedback(() => deleteRequestSuperAdminAction(fd), {
              successMessage: "تم حذف الطلب.",
              errorMessage: "تعذّر الحذف.",
            });
          });
        }}
      >
        <input type="hidden" name="id" value={requestId} />
        <input type="hidden" name="locale" value={locale} />
        <label className="block text-sm font-bold text-red-950">
          للتأكيد، اكتب رمز الطلب أدناه حرفياً كما ظهر أعلاه
          <input
            name="confirm"
            value={confirm}
            onChange={(ev) => setConfirm(ev.target.value)}
            autoComplete="off"
            className="mt-2 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-gov-navy focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            placeholder=""
          />
        </label>
        <button
          type="submit"
          disabled={pending || confirm.trim() !== requestId}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-red-700 bg-red-700 px-4 py-2 text-sm font-bold text-white transition enabled:hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "جاري الحذف…" : "حذف الطلب نهائياً"}
        </button>
      </form>
    </div>
  );
}
