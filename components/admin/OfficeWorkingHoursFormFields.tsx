"use client";

import { useState } from "react";
import {
  DEFAULT_WORKING_HOURS_FROM,
  DEFAULT_WORKING_HOURS_TO,
} from "@/lib/office-working-hours";
import { getTravelerVaccinationsOfficeCharter } from "@/data/traveler-vaccinations-office-charter";
import type { Office } from "@/lib/office-requests/types";
import { officeFieldClass } from "@/components/admin/OfficeFormFields";

type OfficeWorkingHoursFormFieldsProps = {
  office: Office | null;
};

export function OfficeWorkingHoursFormFields({
  office,
}: OfficeWorkingHoursFormFieldsProps) {
  const charterExcept =
    getTravelerVaccinationsOfficeCharter("ar").workingHours.except;
  const wh = office?.workingHours;
  const initialTwentyFourSeven = wh?.twentyFourSeven === true;
  const [twentyFourSeven, setTwentyFourSeven] = useState(initialTwentyFourSeven);

  const defaultFrom = wh?.from ?? DEFAULT_WORKING_HOURS_FROM;
  const defaultTo = wh?.to ?? DEFAULT_WORKING_HOURS_TO;
  const defaultExcept = wh?.exceptAr ?? "";

  return (
    <fieldset className="mt-3 rounded-md border border-gov-gray-200 p-3">
      <legend className="px-1 text-sm font-bold text-gov-navy">
        مواعيد العمل
      </legend>
      <p className="mt-1 text-xs text-gov-gray-600">
        تُعرض في جدول إدارة المكاتب وجدول المكاتب العام. إن تُرك «ما عدا» فارغاً
        يُستخدم نص الميثاق للاستثناء في اللغات غير العربية.
      </p>
      <label className="mt-3 flex items-center gap-2 text-sm font-bold text-gov-navy">
        <input
          name="workingHoursTwentyFourSeven"
          type="checkbox"
          checked={twentyFourSeven}
          onChange={(e) => setTwentyFourSeven(e.target.checked)}
          className="size-4 rounded border-gov-gray-300"
        />
        يعمل على مدار الساعة (٢٤ ساعة)
      </label>
      {!twentyFourSeven ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-bold text-gov-navy">
            من
            <input
              name="workingHoursFrom"
              type="time"
              required
              defaultValue={defaultFrom}
              className={officeFieldClass}
            />
          </label>
          <label className="block text-sm font-bold text-gov-navy">
            إلى
            <input
              name="workingHoursTo"
              type="time"
              required
              defaultValue={defaultTo}
              className={officeFieldClass}
            />
          </label>
          <label className="block text-sm font-bold text-gov-navy sm:col-span-2">
            ما عدا
            <input
              name="workingHoursExceptAr"
              type="text"
              defaultValue={defaultExcept}
              placeholder={charterExcept}
              className={officeFieldClass}
            />
          </label>
        </div>
      ) : null}
    </fieldset>
  );
}
