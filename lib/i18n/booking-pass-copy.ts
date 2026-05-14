import type { Locale } from "@/lib/i18n/config";

export const bookingPassPageCopy = {
  ar: {
    title: "بطاقة الطلب",
    subtitle: "للمكتب — اعرض هذه الصفحة عند الوصول",
    invalidTitle: "الرابط غير صالح",
    invalidBody: "تأكد من مسح رمز الاستجابة السريعة كاملاً أو افتح الرابط من رسالة التأكيد.",
    requestId: "رقم الطلب",
    office: "المكتب",
    travelerType: "نوع المسافر",
    preferredDate: "التاريخ المطلوب",
    status: "الحالة",
    type: "نوع الطلب",
    name: "الاسم",
    details: "التفاصيل",
    notes: "ملاحظات المتابعة",
    noNotes: "لا توجد ملاحظات.",
    siteLine: "إدارة الحجر الصحي بالقاهرة",
  },
  en: {
    title: "Request pass",
    subtitle: "For the office — show this page on arrival",
    invalidTitle: "Invalid link",
    invalidBody:
      "Scan the full QR code or open the link from your confirmation message.",
    requestId: "Request ID",
    office: "Office",
    travelerType: "Traveler type",
    preferredDate: "Preferred date",
    status: "Status",
    type: "Request type",
    name: "Name",
    details: "Details",
    notes: "Follow-up notes",
    noNotes: "No notes yet.",
    siteLine: "Cairo Quarantine Administration",
  },
  zh: {
    title: "申请凭证",
    subtitle: "到达办公室时请出示本页",
    invalidTitle: "链接无效",
    invalidBody: "请完整扫描二维码或从确认消息中打开链接。",
    requestId: "申请编号",
    office: "办公室",
    travelerType: "旅客类型",
    preferredDate: "预约日期",
    status: "状态",
    type: "申请类型",
    name: "姓名",
    details: "详情",
    notes: "跟进备注",
    noNotes: "暂无备注。",
    siteLine: "开罗检疫管理",
  },
} satisfies Record<
  Locale,
  Record<
    | "title"
    | "subtitle"
    | "invalidTitle"
    | "invalidBody"
    | "requestId"
    | "office"
    | "travelerType"
    | "preferredDate"
    | "status"
    | "type"
    | "name"
    | "details"
    | "notes"
    | "noNotes"
    | "siteLine",
    string
  >
>;

export const bookingPassFormCopy = {
  ar: {
    cardTitle: "بطاقة طلبك",
    cardSubtitle: "اعرض الرمز في المكتب أو احفظ الصورة",
    downloadPng: "تحميل بطاقة الحجز (صورة)",
    shareCard: "مشاركة الصورة",
    qrAlt: "رمز الاستجابة السريعة لبطاقة الحجز",
    siteUrlHint:
      "لإنشاء رابط كامل يعمل في واتساب وغيره من الأجهزة، عيّن NEXT_PUBLIC_SITE_URL في إعدادات الاستضافة (مثال: https://example.com).",
  },
  en: {
    cardTitle: "Your request pass",
    cardSubtitle: "Show this code at the office or save the image",
    downloadPng: "Download pass image",
    shareCard: "Share image",
    qrAlt: "QR code for your request pass",
    siteUrlHint:
      "Set NEXT_PUBLIC_SITE_URL in your deployment environment (e.g. https://example.com) so the full pass link works when shared.",
  },
  zh: {
    cardTitle: "您的预约凭证",
    cardSubtitle: "到办公室出示此码或保存图片",
    downloadPng: "下载凭证图片",
    shareCard: "分享图片",
    qrAlt: "预约凭证二维码",
    siteUrlHint:
      "请在部署环境中设置 NEXT_PUBLIC_SITE_URL（例如 https://example.com），以便完整链接可在分享后使用。",
  },
} satisfies Record<
  Locale,
  Record<
    | "cardTitle"
    | "cardSubtitle"
    | "downloadPng"
    | "shareCard"
    | "qrAlt"
    | "siteUrlHint",
    string
  >
>;
