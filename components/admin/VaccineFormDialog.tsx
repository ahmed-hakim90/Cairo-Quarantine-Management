"use client";

import { useRef } from "react";
import { saveVaccineAction } from "@/app/[locale]/admin/actions";
import { VaccineFormFields } from "@/components/admin/VaccineFormFields";
import type { VaccineCatalogEntry } from "@/lib/office-requests/types";

type VaccineFormDialogProps = {
  locale: string;
  vaccine: VaccineCatalogEntry | null;
  buttonLabel: string;
  buttonClassName?: string;
};

export function VaccineFormDialog({
  locale,
  vaccine,
  buttonLabel,
  buttonClassName = "inline-flex min-h-9 items-center justify-center rounded-md border border-gov-gray-200 px-3 text-xs font-extrabold text-gov-navy transition hover:border-gov-accent hover:text-gov-accent",
}: VaccineFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isEdit = Boolean(vaccine);

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => dialogRef.current?.showModal()}
      >
        {buttonLabel}
      </button>
      <dialog
        ref={dialogRef}
        className="m-auto max-h-[90vh] w-[min(100%,32rem)] max-w-[calc(100%-2rem)] overflow-y-auto rounded-lg border border-gov-gray-200 bg-white p-0 shadow-xl backdrop:bg-black/40"
        dir="rtl"
        aria-labelledby="vaccine-form-dialog-title"
      >
        <div className="border-b border-gov-gray-200 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <h2
              id="vaccine-form-dialog-title"
              className="font-heading text-lg font-extrabold text-gov-navy"
            >
              {isEdit ? "تعديل لقاح" : "إضافة لقاح"}
            </h2>
            <button
              type="button"
              className="rounded-md border border-gov-gray-200 px-2 py-1 text-xs font-bold text-gov-navy hover:bg-gov-gray-50"
              onClick={() => dialogRef.current?.close()}
            >
              إغلاق
            </button>
          </div>
        </div>
        <form
          className="space-y-1 px-4 py-4"
          action={async (formData) => {
            try {
              await saveVaccineAction(formData);
              dialogRef.current?.close();
            } catch (err) {
              window.alert(
                err instanceof Error ? err.message : "تعذر حفظ اللقاح.",
              );
            }
          }}
        >
          <input type="hidden" name="locale" value={locale} />
          <VaccineFormFields vaccine={vaccine} />
          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-gov-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-gov-navy"
          >
            حفظ
          </button>
        </form>
      </dialog>
    </>
  );
}
