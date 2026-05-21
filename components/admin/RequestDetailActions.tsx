"use client";

import {
  markWhatsappSentAction,
  updateRequestAction,
} from "@/app/[locale]/admin/actions";
import {
  REQUEST_STATUS_LABELS,
  type OfficeRequest,
} from "@/lib/office-requests/types";
import { runWithFeedback } from "@/lib/ui/run-with-feedback";

const fieldClass =
  "mt-2 w-full rounded-md border border-gov-gray-200 bg-white px-3 py-3 text-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/20";

type RequestDetailActionsProps = {
  locale: string;
  request: OfficeRequest;
};

export function RequestWhatsappSentForm({
  locale,
  request,
}: RequestDetailActionsProps) {
  return (
    <form
      className="mt-4"
      action={async (formData) => {
        await runWithFeedback(() => markWhatsappSentAction(formData), {
          successMessage: "تم تسجيل التواصل.",
          errorMessage: "تعذر تسجيل التواصل.",
        });
      }}
    >
      <input type="hidden" name="id" value={request.id} />
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-gov-gray-200 bg-white px-5 py-3 text-sm font-bold text-gov-navy hover:bg-gov-gray-50"
      >
        تسجيل أنه تم التواصل
      </button>
    </form>
  );
}

export function RequestOfficeActionForm({
  locale,
  request,
}: RequestDetailActionsProps) {
  return (
    <form
      className="self-start rounded-md border border-gov-gray-200 bg-gov-gray-50 p-4"
      action={async (formData) => {
        await runWithFeedback(() => updateRequestAction(formData), {
          successMessage: "تم حفظ الإجراء.",
          errorMessage: "تعذر حفظ الإجراء.",
        });
      }}
    >
      <input type="hidden" name="id" value={request.id} />
      <input type="hidden" name="locale" value={locale} />
      <h2 className="font-heading text-lg font-bold text-gov-navy">
        إجراء المكتب
      </h2>
      <label className="mt-4 block text-sm font-bold text-gov-navy">
        الحالة
        <select
          name="status"
          defaultValue={request.status}
          className={fieldClass}
        >
          {Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {request.type === "booking" ? (
        <label className="mt-4 block text-sm font-bold text-gov-navy">
          تاريخ الحجز
          <input
            type="date"
            name="preferredDate"
            defaultValue={request.preferredDate ?? ""}
            className={fieldClass}
          />
        </label>
      ) : null}
      <label className="mt-4 block text-sm font-bold text-gov-navy">
        رقم الهاتف
        <input
          type="tel"
          name="phone"
          defaultValue={request.phone}
          className={fieldClass}
          dir="ltr"
        />
      </label>
      <label className="mt-4 block text-sm font-bold text-gov-navy">
        ملاحظات المتابعة
        <textarea
          name="notes"
          rows={8}
          defaultValue={request.notes}
          className={fieldClass}
        />
      </label>
      <button
        type="submit"
        className="mt-4 w-full rounded-md bg-gov-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-gov-navy"
      >
        حفظ الإجراء
      </button>
    </form>
  );
}
