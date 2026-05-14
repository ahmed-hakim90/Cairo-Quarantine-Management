"use client";

import { setTravelerStateActiveAction } from "@/app/[locale]/admin/actions";

type SetTravelerStateActiveFormProps = {
  locale: string;
  travelerStateId: string;
  labelAr: string;
  active: boolean;
  label: string;
  className?: string;
};

export function SetTravelerStateActiveForm({
  locale,
  travelerStateId,
  labelAr,
  active,
  label,
  className = "inline-flex min-h-9 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-red-800 transition hover:bg-red-100",
}: SetTravelerStateActiveFormProps) {
  return (
    <form
      action={setTravelerStateActiveAction}
      className="inline"
      onSubmit={(e) => {
        if (!active) {
          const ok = window.confirm(
            `سيتم تعطيل حالة «${labelAr}» ولن تظهر في نموذج الحجز. يمكنك إعادة تفعيلها لاحقاً. متابعة؟`,
          );
          if (!ok) e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="travelerStateId" value={travelerStateId} />
      <input type="hidden" name="active" value={active ? "true" : "false"} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
