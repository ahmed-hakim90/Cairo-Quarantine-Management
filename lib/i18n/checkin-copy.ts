import type { Locale } from "@/lib/i18n/config";

export const checkinPageCopy = {
  ar: {
    metaTitle: "تسجيل الحضور",
    invalidLink:
      "رابط غير صالح. امسح رمز QR الخاص بالمكتب أو اطلب الرابط الصحيح من الموظف.",
    officeUnavailable: "المكتب غير متاح أو الرابط غير صحيح.",
    dailyLabel: "حضور يومي",
    heading: "تسجيل الحضور",
  },
  en: {
    metaTitle: "Check-in",
    invalidLink:
      "Invalid link. Scan the office QR code or ask staff for the correct link.",
    officeUnavailable: "This office is unavailable or the link is incorrect.",
    dailyLabel: "Daily check-in",
    heading: "Check-in",
  },
  zh: {
    metaTitle: "签到",
    invalidLink: "链接无效。请扫描办公室二维码或向工作人员索取正确链接。",
    officeUnavailable: "该办公室不可用或链接不正确。",
    dailyLabel: "每日签到",
    heading: "签到",
  },
  fr: {
    metaTitle: "Enregistrement de presence",
    invalidLink:
      "Lien invalide. Scannez le QR du bureau ou demandez le bon lien au personnel.",
    officeUnavailable: "Ce bureau n'est pas disponible ou le lien est incorrect.",
    dailyLabel: "Presence quotidienne",
    heading: "Enregistrement de presence",
  },
} satisfies Record<Locale, Record<string, string>>;

export const checkinFormCopy = {
  ar: {
    restoring: "جاري استعادة دورك…",
    lookupLabel: "رقم الطلب أو رقم الهاتف",
    lookupPlaceholder:
      "مثال: cairo-trav-17-000001 أو CQM-000123 أو 010…",
    lookupPending: "جاري التحقق…",
    lookupSubmit: "تسجيل الحضور",
    quickTitle: "لم يُعثر على طلب — يمكنك إنشاء طلب حضور سريع",
    name: "الاسم",
    phone: "رقم الهاتف",
    travelerState: "حالة المسافر",
    chooseTravelerState: "اختر حالة المسافر",
    specialNeeds: "ذوي همم",
    elderly: "كبار السن",
    notesOptional: "ملاحظات (اختياري)",
    quickPending: "جاري التسجيل…",
    quickSubmit: "إنشاء طلب وتسجيل الحضور",
  },
  en: {
    restoring: "Restoring your queue position…",
    lookupLabel: "Request number or phone",
    lookupPlaceholder: "e.g. cairo-trav-17-000001 or CQM-000123 or 010…",
    lookupPending: "Checking…",
    lookupSubmit: "Check in",
    quickTitle: "No request found — you can create a quick walk-in request",
    name: "Name",
    phone: "Phone number",
    travelerState: "Traveller status",
    chooseTravelerState: "Choose traveller status",
    specialNeeds: "Person with disabilities",
    elderly: "Older adult",
    notesOptional: "Notes (optional)",
    quickPending: "Registering…",
    quickSubmit: "Create request and check in",
  },
  zh: {
    restoring: "正在恢复您的排队位置…",
    lookupLabel: "申请编号或电话",
    lookupPlaceholder: "例如：cairo-trav-17-000001 或 CQM-000123 或 010…",
    lookupPending: "正在验证…",
    lookupSubmit: "签到",
    quickTitle: "未找到申请 — 可创建快速现场申请",
    name: "姓名",
    phone: "电话号码",
    travelerState: "旅客状态",
    chooseTravelerState: "请选择旅客状态",
    specialNeeds: "残障人士",
    elderly: "老年人",
    notesOptional: "备注（可选）",
    quickPending: "正在登记…",
    quickSubmit: "创建申请并签到",
  },
  fr: {
    restoring: "Restauration de votre position dans la file…",
    lookupLabel: "Numero de demande ou telephone",
    lookupPlaceholder:
      "ex. cairo-trav-17-000001 ou CQM-000123 ou 010…",
    lookupPending: "Verification…",
    lookupSubmit: "Enregistrer la presence",
    quickTitle:
      "Aucune demande trouvee — vous pouvez creer une demande rapide sur place",
    name: "Nom",
    phone: "Numero de telephone",
    travelerState: "Statut du voyageur",
    chooseTravelerState: "Choisissez le statut du voyageur",
    specialNeeds: "Personne en situation de handicap",
    elderly: "Personne agee",
    notesOptional: "Remarques (facultatif)",
    quickPending: "Enregistrement…",
    quickSubmit: "Creer la demande et s'enregistrer",
  },
} satisfies Record<Locale, Record<string, string>>;

export const checkinActionCopy = {
  ar: {
    rateLimited: "تم تجاوز عدد المحاولات. انتظر قليلاً ثم حاول مرة أخرى.",
    lookupRequired: "يرجى إدخال رقم الطلب أو الهاتف.",
    wrongOffice:
      "هذا الطلب مسجّل لمكتب آخر. تأكد من مسح رمز QR الصحيح.",
    notBookingDay:
      "لسه تاريخك مجاش. عد في تاريخ حجزك المحدد.",
    checkinFailed: "تعذر تسجيل الحضور.",
    restoreFailed: "لم يُعثر على دورك لهذا اليوم. سجّل حضورك من جديد.",
    restoreSessionFailed: "تعذر استعادة جلسة الحضور.",
    quickRequired: "يرجى إدخال الاسم ورقم الهاتف وحالة المسافر.",
    travelerStateUnavailable: "حالة المسافر غير متاحة لهذا المكتب.",
    quickFailed: "تعذر إنشاء الطلب وتسجيل الحضور.",
  },
  en: {
    rateLimited: "Too many attempts. Wait a moment and try again.",
    lookupRequired: "Enter the request number or phone.",
    wrongOffice:
      "This request belongs to another office. Scan the correct office QR code.",
    notBookingDay:
      "Your booking date has not arrived yet. Please return on your booking date.",
    checkinFailed: "Check-in could not be completed.",
    restoreFailed:
      "Your queue position for today was not found. Please check in again.",
    restoreSessionFailed: "Could not restore the check-in session.",
    quickRequired: "Enter your name, phone, and traveller status.",
    travelerStateUnavailable:
      "This traveller status is not available for this office.",
    quickFailed: "Could not create the request and check in.",
  },
  zh: {
    rateLimited: "尝试次数过多。请稍后再试。",
    lookupRequired: "请输入申请编号或电话。",
    wrongOffice: "该申请属于其他办公室。请扫描正确的办公室二维码。",
    notBookingDay: "排队签到仅在预约当天可用。请在预约日期当天再来。",
    checkinFailed: "无法完成签到。",
    restoreFailed: "未找到您今日的排队位置。请重新签到。",
    restoreSessionFailed: "无法恢复签到会话。",
    quickRequired: "请输入姓名、电话和旅客状态。",
    travelerStateUnavailable: "该旅客状态不适用于此办公室。",
    quickFailed: "无法创建申请并完成签到。",
  },
  fr: {
    rateLimited: "Trop de tentatives. Attendez un moment puis reessayez.",
    lookupRequired: "Saisissez le numero de demande ou le telephone.",
    wrongOffice:
      "Cette demande est enregistree dans un autre bureau. Scannez le bon QR.",
    notBookingDay:
      "L'enregistrement dans la file n'est disponible que le jour du rendez-vous.",
    checkinFailed: "L'enregistrement de presence a echoue.",
    restoreFailed:
      "Votre position dans la file pour aujourd'hui est introuvable. Reenregistrez-vous.",
    restoreSessionFailed: "Impossible de restaurer la session de presence.",
    quickRequired:
      "Saisissez le nom, le telephone et le statut du voyageur.",
    travelerStateUnavailable:
      "Ce statut de voyageur n'est pas disponible pour ce bureau.",
    quickFailed: "Impossible de creer la demande et de s'enregistrer.",
  },
} satisfies Record<Locale, Record<string, string>>;

export const checkinBookingCopy = {
  ar: {
    heading: "حجز دور في الطابور",
    requestSummary: "طلبك",
    bookingDateLabel: "تاريخ حجزك",
    officeLabel: "المكتب",
    nameLabel: "الاسم",
    confirmPrompt: "تحب تحجز دور في الطابور اليوم؟",
    confirmButton: "نعم، احجز دوري",
    confirmPending: "جاري حجز الدور…",
    dateNotYet: "لسه تاريخك مجاش. عد يوم {date}.",
    datePassed: "تاريخ حجزك كان {date}.",
    notBookingRequest: "هذا الرابط مخصص لحجوزات المواعيد فقط.",
    requestNotFound: "لم يُعثر على الطلب. تأكد من الرابط أو سجّل حضورك يدوياً.",
    useManualCheckin: "تسجيل حضور يدوي",
    calendarHint: "أضف موعدك للتقويم علشان يفكّرك بيوم الحجز",
    downloadCalendar: "تحميل ملف التقويم",
    googleCalendar: "Google Calendar",
    calendarEventTitle: "موعد الحجز — {office}",
    calendarEventDescription:
      "طلب #{id}\nالمكتب: {office}\nالتاريخ: {date}\nرابط حجز الدور: {checkinLink}",
  },
  en: {
    heading: "Book a queue turn",
    requestSummary: "Your request",
    bookingDateLabel: "Your booking date",
    officeLabel: "Office",
    nameLabel: "Name",
    confirmPrompt: "Would you like to book your queue turn today?",
    confirmButton: "Yes, book my turn",
    confirmPending: "Booking your turn…",
    dateNotYet: "Your booking date has not arrived yet. Please return on {date}.",
    datePassed: "Your booking date was {date}.",
    notBookingRequest: "This link is for appointment bookings only.",
    requestNotFound: "Request not found. Check the link or check in manually.",
    useManualCheckin: "Manual check-in",
    calendarHint: "Add the appointment to your calendar so you do not forget",
    downloadCalendar: "Download calendar file",
    googleCalendar: "Google Calendar",
    calendarEventTitle: "Booking appointment — {office}",
    calendarEventDescription:
      "Request #{id}\nOffice: {office}\nDate: {date}\nQueue link: {checkinLink}",
  },
  zh: {
    heading: "预约排队号",
    requestSummary: "您的申请",
    bookingDateLabel: "预约日期",
    officeLabel: "办公室",
    nameLabel: "姓名",
    confirmPrompt: "是否要在今天预约排队号？",
    confirmButton: "是的，预约排队",
    confirmPending: "正在预约排队…",
    dateNotYet: "预约日期尚未到达。请在 {date} 再来。",
    datePassed: "您的预约日期是 {date}。",
    notBookingRequest: "此链接仅适用于预约申请。",
    requestNotFound: "未找到申请。请检查链接或手动签到。",
    useManualCheckin: "手动签到",
    calendarHint: "将预约日期添加到日历以免忘记",
    downloadCalendar: "下载日历文件",
    googleCalendar: "Google 日历",
    calendarEventTitle: "预约 — {office}",
    calendarEventDescription:
      "申请 #{id}\n办公室: {office}\n日期: {date}\n排队链接: {checkinLink}",
  },
  fr: {
    heading: "Reserver un tour dans la file",
    requestSummary: "Votre demande",
    bookingDateLabel: "Date de rendez-vous",
    officeLabel: "Bureau",
    nameLabel: "Nom",
    confirmPrompt: "Voulez-vous reserver votre tour dans la file aujourd'hui ?",
    confirmButton: "Oui, reserver mon tour",
    confirmPending: "Reservation en cours…",
    dateNotYet: "Votre date de rendez-vous n'est pas encore arrivee. Revenez le {date}.",
    datePassed: "Votre date de rendez-vous etait le {date}.",
    notBookingRequest: "Ce lien est reserve aux rendez-vous de reservation.",
    requestNotFound:
      "Demande introuvable. Verifiez le lien ou enregistrez-vous manuellement.",
    useManualCheckin: "Enregistrement manuel",
    calendarHint: "Ajoutez le rendez-vous a votre calendrier pour ne pas l'oublier",
    downloadCalendar: "Telecharger le fichier calendrier",
    googleCalendar: "Google Calendar",
    calendarEventTitle: "Rendez-vous — {office}",
    calendarEventDescription:
      "Demande #{id}\nBureau: {office}\nDate: {date}\nLien file: {checkinLink}",
  },
} satisfies Record<
  Locale,
  Record<
    | "heading"
    | "requestSummary"
    | "bookingDateLabel"
    | "officeLabel"
    | "nameLabel"
    | "confirmPrompt"
    | "confirmButton"
    | "confirmPending"
    | "dateNotYet"
    | "datePassed"
    | "notBookingRequest"
    | "requestNotFound"
    | "useManualCheckin"
    | "calendarHint"
    | "downloadCalendar"
    | "googleCalendar"
    | "calendarEventTitle"
    | "calendarEventDescription",
    string
  >
>;

/** Map legacy Arabic server messages to localized check-in errors. */
export function localizeCheckinError(
  locale: Locale,
  raw: string | undefined,
  fallback: keyof (typeof checkinActionCopy)["ar"],
): string {
  const t = checkinActionCopy[locale];
  const ar = checkinActionCopy.ar;
  if (!raw) return t[fallback];
  if (raw === ar.rateLimited) return t.rateLimited;
  if (raw === ar.lookupRequired) return t.lookupRequired;
  if (raw === ar.wrongOffice) return t.wrongOffice;
  if (raw === ar.notBookingDay) return t.notBookingDay;
  if (raw === ar.checkinFailed) return t.checkinFailed;
  if (raw === ar.restoreFailed) return t.restoreFailed;
  if (raw === ar.restoreSessionFailed) return t.restoreSessionFailed;
  if (raw === ar.quickRequired) return t.quickRequired;
  if (raw === ar.travelerStateUnavailable) return t.travelerStateUnavailable;
  if (raw === ar.quickFailed) return t.quickFailed;
  return raw;
}
