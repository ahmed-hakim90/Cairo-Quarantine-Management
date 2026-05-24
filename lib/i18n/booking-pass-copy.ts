import type { Locale } from "@/lib/i18n/config";

export const bookingPassPageCopy = {
  ar: {
    title: "بطاقة الطلب",
    subtitle: "للمكتب — لمعرفة تفاصيل طلبك ",
    subtitleComplaint: "جاري متابعة الشكوى",
    invalidTitle: "الرابط غير صالح",
    invalidBody: "تأكد من فتح الرابط كاملاً من رسالة التأكيد أو بطاقة المتابعة.",
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
    keepCardNotice:
      "ملاحظة: برجاء الحفاظ على كارت المتابعة علشان تتقدر تتابع طلبك.",
    queueCta: "احجز دورك في الطابور",
  },
  en: {
    title: "Request pass",
    subtitle: "For the office — show this page on arrival",
    subtitleComplaint: "Complaint follow-up in progress",
    invalidTitle: "Invalid link",
    invalidBody:
      "Open the full link from your confirmation message or follow-up card.",
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
    keepCardNotice:
      "Please keep this follow-up card so you can track your request.",
    queueCta: "Book your queue turn",
  },
  zh: {
    title: "申请凭证",
    subtitle: "到达办公室时请出示本页",
    subtitleComplaint: "正在跟进您的投诉",
    invalidTitle: "链接无效",
    invalidBody: "请从确认消息或跟进卡中打开完整链接。",
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
    keepCardNotice: "请妥善保存此跟进卡以便查询申请状态。",
    queueCta: "预约排队号",
  },
  fr: {
    title: "Pass de demande",
    subtitle: "Pour le bureau — presentez cette page a votre arrivee",
    subtitleComplaint: "Suivi de la plainte en cours",
    invalidTitle: "Lien invalide",
    invalidBody:
      "Ouvrez le lien complet depuis votre message de confirmation ou la carte de suivi.",
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
    keepCardNotice:
      "Conservez cette carte de suivi pour pouvoir suivre votre demande.",
    queueCta: "Reserver votre tour dans la file",
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
    | "siteLine"
    | "keepCardNotice"
    | "queueCta",
    string
  >
>;

export const bookingPassFormCopy = {
  ar: {
    cardTitle: "بطاقة طلبك",
    cardSubtitle: "حمّل بطاقة PDF أو أضف موعدك للتقويم",
    cardSubtitleComplaint: "جاري متابعة الشكوى — افتح صفحة المتابعة أو حمّل PDF",
    downloadPdf: "تحميل بطاقة PDF",
    openTracking: "فتح صفحة المتابعة",
    passSectionTitle: "بطاقة المتابعة",
    siteUrlHint:
      "لإنشاء رابط كامل يعمل في واتساب وغيره من الأجهزة، عيّن NEXT_PUBLIC_SITE_URL في إعدادات الاستضافة (مثال: https://example.com).",
    keepCardNotice:
      "ملاحظة: برجاء الحفاظ على كارت المتابعة علشان تتقدر تتابع طلبك.",
    queueLinkLabel: "حجز دور في الطابور",
    queueSameDayNote: "حجز الدور متاح في يوم الحجز فقط.",
  },
  en: {
    cardTitle: "Your request pass",
    cardSubtitle: "Download the PDF card or add the appointment to your calendar",
    cardSubtitleComplaint:
      "Complaint follow-up in progress — open tracking or download PDF",
    downloadPdf: "Download PDF card",
    openTracking: "Open tracking page",
    passSectionTitle: "Follow-up card",
    siteUrlHint:
      "Set NEXT_PUBLIC_SITE_URL in your deployment environment (e.g. https://example.com) so the full pass link works when shared.",
    keepCardNotice:
      "Please keep this follow-up card so you can track your request.",
    queueLinkLabel: "Book a queue turn",
    queueSameDayNote: "Queue booking is available on your booking day only.",
  },
  zh: {
    cardTitle: "您的预约凭证",
    cardSubtitle: "下载 PDF 凭证或将预约日期添加到日历",
    cardSubtitleComplaint: "正在跟进投诉 — 打开跟进页面或下载 PDF",
    downloadPdf: "下载 PDF 凭证",
    openTracking: "打开跟进页面",
    passSectionTitle: "跟进卡",
    siteUrlHint:
      "请在部署环境中设置 NEXT_PUBLIC_SITE_URL（例如 https://example.com），以便完整链接可在分享后使用。",
    keepCardNotice: "请妥善保存此跟进卡以便查询申请状态。",
    queueLinkLabel: "预约排队号",
    queueSameDayNote: "排队号仅在预约当天可用。",
  },
  fr: {
    cardTitle: "Votre pass de demande",
    cardSubtitle:
      "Telechargez la carte PDF ou ajoutez le rendez-vous a votre calendrier",
    cardSubtitleComplaint:
      "Suivi de la plainte en cours — ouvrez le suivi ou telechargez le PDF",
    downloadPdf: "Telecharger la carte PDF",
    openTracking: "Ouvrir la page de suivi",
    passSectionTitle: "Carte de suivi",
    siteUrlHint:
      "Definissez NEXT_PUBLIC_SITE_URL dans l'environnement de deploiement (ex. https://example.com) pour que le lien complet fonctionne apres partage.",
    keepCardNotice:
      "Conservez cette carte de suivi pour pouvoir suivre votre demande.",
    queueLinkLabel: "Reserver un tour dans la file",
    queueSameDayNote:
      "La reservation dans la file n'est disponible que le jour du rendez-vous.",
  },
} satisfies Record<
  Locale,
  Record<
    | "cardTitle"
    | "cardSubtitle"
    | "cardSubtitleComplaint"
    | "downloadPdf"
    | "openTracking"
    | "passSectionTitle"
    | "siteUrlHint"
    | "keepCardNotice"
    | "queueLinkLabel"
    | "queueSameDayNote",
    string
  >
>;

export const bookingPassPdfCopy = {
  ar: {
    trackingLinkLabel: "متابعة الطلب",
    queueLinkLabel: "حجز دور في الطابور",
    queueSameDayNote: "حجز الدور متاح في يوم الحجز فقط.",
    keepCardNotice:
      "ملاحظة: برجاء الحفاظ على كارت المتابعة علشان تتقدر تتابع طلبك.",
  },
  en: {
    trackingLinkLabel: "Track your request",
    queueLinkLabel: "Book a queue turn",
    queueSameDayNote: "Queue booking is available on your booking day only.",
    keepCardNotice:
      "Please keep this follow-up card so you can track your request.",
  },
  zh: {
    trackingLinkLabel: "跟进申请",
    queueLinkLabel: "预约排队号",
    queueSameDayNote: "排队号仅在预约当天可用。",
    keepCardNotice: "请妥善保存此跟进卡以便查询申请状态。",
  },
  fr: {
    trackingLinkLabel: "Suivre la demande",
    queueLinkLabel: "Reserver un tour dans la file",
    queueSameDayNote:
      "La reservation dans la file n'est disponible que le jour du rendez-vous.",
    keepCardNotice:
      "Conservez cette carte de suivi pour pouvoir suivre votre demande.",
  },
} satisfies Record<
  Locale,
  Record<
    "trackingLinkLabel" | "queueLinkLabel" | "queueSameDayNote" | "keepCardNotice",
    string
  >
>;
