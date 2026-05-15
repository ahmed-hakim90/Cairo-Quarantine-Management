"use client";

import { useId, useState, type ReactNode } from "react";

type SuperAdminAdvancedSettingsGateProps = {
  children: ReactNode;
};

export function SuperAdminAdvancedSettingsGate({
  children,
}: SuperAdminAdvancedSettingsGateProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-start"
      >
        <span className="text-lg font-extrabold text-gov-navy">
          {open ? "إخفاء الإعدادات المتقدمة" : "إعدادات متقدمة"}
        </span>
        <span
          className="text-gov-accent"
          aria-hidden
        >
          {open ? "▲" : "▼"}
        </span>
      </button>
      {!open ? (
        <p className="mt-3 text-sm text-gov-gray-600">
          النسخ الاحتياطي، واستعادة البيانات، والحذف الجماعي — تظهر فقط عند
          الحاجة. استخدمها بحذر شديد.
        </p>
      ) : null}
      {open ? (
        <div id={panelId} className="mt-6 border-t border-gov-gray-100 pt-6">
          <p className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
            هذا القسم يؤثر على بيانات النظام بالكامل. تأكد من صلاحية النسخة
            الاحتياطية قبل أي حذف أو استيراد.
          </p>
          {children}
        </div>
      ) : null}
    </div>
  );
}
