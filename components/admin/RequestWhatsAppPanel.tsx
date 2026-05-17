"use client";

import { useMemo, useState } from "react";
import {
  renderTemplate,
  toWhatsappWaMeDigits,
  whatsappUrl,
} from "@/lib/office-requests/whatsapp-message";
import type { MessageTemplate, Office, OfficeRequest } from "@/lib/office-requests/types";

type RequestWhatsAppPanelProps = {
  phone: string;
  templates: MessageTemplate[];
  request: OfficeRequest;
  office: Office;
  locale: string;
  /** From `headers()` on the server; may be empty behind some proxies. */
  siteOrigin: string;
  travelerStateLabelById?: Record<string, string>;
};

export function RequestWhatsAppPanel({
  phone,
  templates,
  request,
  office,
  locale,
  siteOrigin: siteOriginFromServer,
  travelerStateLabelById,
}: RequestWhatsAppPanelProps) {
  const siteOrigin = useMemo(() => {
    const env = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
    if (env) return env;
    return siteOriginFromServer.replace(/\/+$/, "");
  }, [siteOriginFromServer]);

  const templateLocale =
    locale === "en" || locale === "zh" || locale === "fr" ? locale : "ar";

  const [pickId, setPickId] = useState<string | null>(null);
  const [editedOverride, setEditedOverride] = useState<string | null>(null);

  const effectiveId = useMemo(() => {
    if (templates.length === 0) return "";
    if (pickId && templates.some((t) => t.id === pickId)) return pickId;
    return templates[0]!.id;
  }, [templates, pickId]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === effectiveId),
    [templates, effectiveId],
  );

  const rendered = useMemo(() => {
    if (!selectedTemplate) return "";
    return renderTemplate({
      template: selectedTemplate,
      request,
      office,
      siteOrigin,
      locale: templateLocale,
      travelerStateLabelById,
    });
  }, [selectedTemplate, request, office, siteOrigin, templateLocale, travelerStateLabelById]);

  const messageText = editedOverride !== null ? editedOverride : rendered;
  const waMeDigits = toWhatsappWaMeDigits(phone);
  const canOpenWhatsapp = waMeDigits.length >= 10;
  const href = canOpenWhatsapp ? whatsappUrl(phone, messageText) : null;

  if (templates.length === 0) {
    return (
      <p className="mt-3 text-sm text-gov-gray-600">
        لا توجد قوالب واتساب مفعّلة. يضيفها السوبر أدمن من لوحة التحكم.
      </p>
    );
  }

  function onPickTemplate(id: string) {
    setPickId(id);
    setEditedOverride(null);
  }

  return (
    <div className="mt-3 space-y-4">
      <div className="overflow-x-auto rounded-md border border-gov-gray-200">
        <table className="min-w-full divide-y divide-gov-gray-200 text-sm">
          <thead className="bg-gov-gray-50">
            <tr>
              <th className="w-10 px-2 py-2" aria-label="اختيار" />
              <th className="px-3 py-2 text-start font-bold text-gov-navy">
                القالب
              </th>
              <th className="px-3 py-2 text-start font-bold text-gov-navy">
                معاينة النص
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gov-gray-200 bg-white">
            {templates.map((row) => {
              const checked = row.id === effectiveId;
              const rowPreview = renderTemplate({
                template: row,
                request,
                office,
                siteOrigin,
                locale: templateLocale,
              });
              return (
                <tr
                  key={row.id}
                  className={
                    checked ? "bg-emerald-50/80 cursor-pointer" : "cursor-pointer"
                  }
                  onClick={() => onPickTemplate(row.id)}
                >
                  <td className="px-2 py-2 align-middle">
                    <input
                      type="radio"
                      name="wa_template"
                      checked={checked}
                      onChange={() => onPickTemplate(row.id)}
                      className="size-4 accent-gov-accent"
                      aria-label={`اختيار ${row.title}`}
                    />
                  </td>
                  <td className="px-3 py-2 font-bold text-gov-navy">{row.title}</td>
                  <td className="max-w-[min(28rem,50vw)] px-3 py-2 text-xs leading-relaxed text-gov-gray-600">
                    {rowPreview.slice(0, 120)}
                    {rowPreview.length > 120 ? "…" : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <label
          htmlFor="wa-custom-message"
          className="block text-sm font-bold text-gov-navy"
        >
          نص الرسالة (يمكنك التعديل قبل الإرسال)
        </label>
        <textarea
          id="wa-custom-message"
          value={messageText}
          onChange={(e) => setEditedOverride(e.target.value)}
          rows={10}
          className="mt-2 w-full rounded-md border border-emerald-200 bg-emerald-50/50 px-3 py-3 text-sm leading-relaxed text-emerald-950 focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
        />
      </div>

      {!canOpenWhatsapp ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          رقم الهاتف المحفوظ مع الطلب غير كافٍ لفتح واتساب تلقائياً (تأكد أنه يحتوي على أرقام بصيغة صحيحة). يمكنك
          نسخ النص أعلاه وفتح محادثة مع صاحب الطلب في واتساب يدوياً ولصق النص هناك.
        </p>
      ) : null}

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition hover:brightness-95"
        >
          فتح واتساب
        </a>
      ) : null}
    </div>
  );
}
