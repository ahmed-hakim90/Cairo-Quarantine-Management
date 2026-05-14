/**
 * Placeholders supported by `renderTemplate` in `whatsapp-message.ts`.
 * Keep `key` values in sync with the `values` map there.
 */
export type WhatsappTemplateVariable = {
  key: string;
  labelAr: string;
};

export const WHATSAPP_TEMPLATE_VARIABLES: WhatsappTemplateVariable[] = [
  { key: "name", labelAr: "اسم العميل" },
  { key: "phone", labelAr: "هاتف العميل" },
  { key: "officeName", labelAr: "اسم المكتب" },
  { key: "officeAddress", labelAr: "عنوان المكتب" },
  { key: "officeMapUrl", labelAr: "رابط خرائط المكتب" },
  { key: "requestType", labelAr: "نوع الطلب (رمز)" },
  { key: "requestTypeAr", labelAr: "نوع الطلب (عربي)" },
  { key: "requestDetails", labelAr: "تفاصيل الطلب" },
  { key: "requestId", labelAr: "رقم الطلب" },
  { key: "preferredDate", labelAr: "التاريخ المفضل" },
  { key: "travelerCategoryAr", labelAr: "فئة المسافر (قديمة أو مشتقة)" },
  { key: "travelerStateAr", labelAr: "حالة المسافر (الاسم المعروض)" },
  {
    key: "bookingPassUrl",
    labelAr: "رابط متابعة الطلب وعرض الحالة (بطاقة الحجز الإلكترونية)",
  },
];

export function whatsappTemplatePlaceholder(key: string) {
  return `{${key}}`;
}
