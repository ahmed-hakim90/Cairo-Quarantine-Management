"use client";

import { setOfficeActiveAction } from "@/app/[locale]/admin/actions";
import { runWithFeedback } from "@/lib/ui/run-with-feedback";

type SetOfficeActiveFormProps = {
  locale: string;
  officeId: string;
  officeNameAr: string;
  active: boolean;
  label: string;
  className?: string;
};

export function SetOfficeActiveForm({
  locale,
  officeId,
  officeNameAr,
  active,
  label,
  className = "inline-flex min-h-9 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-red-800 transition hover:bg-red-100",
}: SetOfficeActiveFormProps) {
  return (
    <form
      className="inline"
      onSubmit={(e) => {
        if (!active) {
          const ok = window.confirm(
            `سيتم تعطيل المكتب «${officeNameAr}» ولن يظهر للمسافرين الجدد. يمكنك إعادة تفعيله لاحقاً من التعديل. متابعة؟`,
          );
          if (!ok) {
            e.preventDefault();
            return;
          }
        }
      }}
      action={async (formData) => {
        await runWithFeedback(() => setOfficeActiveAction(formData), {
          successMessage: active ? "تم تفعيل المكتب." : "تم تعطيل المكتب.",
          errorMessage: "تعذر تحديث حالة المكتب.",
        });
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="officeId" value={officeId} />
      <input type="hidden" name="active" value={active ? "true" : "false"} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
