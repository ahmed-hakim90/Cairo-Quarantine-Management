"use client";

import { setVaccineActiveAction } from "@/app/[locale]/admin/actions";
import { runWithFeedback } from "@/lib/ui/run-with-feedback";

type SetVaccineActiveFormProps = {
  locale: string;
  vaccineId: string;
  vaccineLabelAr: string;
  active: boolean;
  label: string;
  className?: string;
};

export function SetVaccineActiveForm({
  locale,
  vaccineId,
  vaccineLabelAr,
  active,
  label,
  className = "inline-flex min-h-9 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-red-800 transition hover:bg-red-100",
}: SetVaccineActiveFormProps) {
  return (
    <form
      className="inline"
      onSubmit={(e) => {
        if (!active) {
          const ok = window.confirm(
            `سيتم تعطيل اللقاح «${vaccineLabelAr}» ولن يظهر في دليل الأسعار للمسافرين. يمكنك إعادة تفعيله لاحقاً. متابعة؟`,
          );
          if (!ok) {
            e.preventDefault();
            return;
          }
        }
      }}
      action={async (formData) => {
        await runWithFeedback(() => setVaccineActiveAction(formData), {
          successMessage: active ? "تم تفعيل اللقاح." : "تم تعطيل اللقاح.",
          errorMessage: "تعذر تحديث حالة اللقاح.",
        });
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="vaccineId" value={vaccineId} />
      <input type="hidden" name="active" value={active ? "true" : "false"} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
