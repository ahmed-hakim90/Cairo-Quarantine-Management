import type { Locale } from "@/lib/i18n/config";

export const bookingPassPageCopy = {
  ar: {
    title: "بطاقة الطلب",
    subtitle: "للمكتب — اعرض هذه الصفحة عند الوصول",
    subtitleComplaint: "جاري متابعة الشكوى",
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
    subtitleComplaint: "Complaint follow-up in progress",
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
    subtitleComplaint: "正在跟进您的投诉",
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
  fr: {
    title: "Pass de demande",
    subtitle: "Pour le bureau — presentez cette page a votre arrivee",
    subtitleComplaint: "Suivi de la plainte en cours",
    invalidTitle: "Lien invalide",
    invalidBody:
      "Scannez le QR code complet ou ouvrez le lien depuis votre message de confirmation.",
    requestId: "Numero de demande",
    office: "Bureau",
    travelerType: "Type de voyageur",
    preferredDate: "Date souhaitee",
    status: "Statut",
    type: "Type de demande",
    name: "Nom",
    details: "Details",
    notes: "Notes de suivi",
    noNotes: "Aucune note pour le moment.",
    siteLine: "Administration de la quarantaine du Caire",
  },
} satisfies Record<
  Locale,
  Record<
    | "title"
    | "subtitle"
    | "subtitleComplaint"
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
    cardSubtitleComplaint: "جاري متابعة الشكوى — احفظ الرمز أو شارك الصورة",
    downloadPng: "تحميل بطاقة الحجز (صورة)",
    shareCard: "مشاركة الصورة",
    qrAlt: "رمز الاستجابة السريعة لبطاقة الحجز",
    siteUrlHint:
      "لإنشاء رابط كامل يعمل في واتساب وغيره من الأجهزة، عيّن NEXT_PUBLIC_SITE_URL في إعدادات الاستضافة (مثال: https://example.com).",
  },
  en: {
    cardTitle: "Your request pass",
    cardSubtitle: "Show this code at the office or save the image",
    cardSubtitleComplaint:
      "Complaint follow-up in progress — save the code or share the image",
    downloadPng: "Download pass image",
    shareCard: "Share image",
    qrAlt: "QR code for your request pass",
    siteUrlHint:
      "Set NEXT_PUBLIC_SITE_URL in your deployment environment (e.g. https://example.com) so the full pass link works when shared.",
  },
  zh: {
    cardTitle: "您的预约凭证",
    cardSubtitle: "到办公室出示此码或保存图片",
    cardSubtitleComplaint: "正在跟进投诉 — 可保存二维码或分享图片",
    downloadPng: "下载凭证图片",
    shareCard: "分享图片",
    qrAlt: "预约凭证二维码",
    siteUrlHint:
      "请在部署环境中设置 NEXT_PUBLIC_SITE_URL（例如 https://example.com），以便完整链接可在分享后使用。",
  },
  fr: {
    cardTitle: "Votre pass de demande",
    cardSubtitle: "Presentez ce code au bureau ou enregistrez l'image",
    cardSubtitleComplaint:
      "Suivi de la plainte en cours — enregistrez le code ou partagez l'image",
    downloadPng: "Telecharger l'image du pass",
    shareCard: "Partager l'image",
    qrAlt: "QR code de votre pass de demande",
    siteUrlHint:
      "Definissez NEXT_PUBLIC_SITE_URL dans l'environnement de deploiement (ex. https://example.com) pour que le lien complet fonctionne apres partage.",
  },
} satisfies Record<
  Locale,
  Record<
    | "cardTitle"
    | "cardSubtitle"
    | "cardSubtitleComplaint"
    | "downloadPng"
    | "shareCard"
    | "qrAlt"
    | "siteUrlHint",
    string
  >
>;
