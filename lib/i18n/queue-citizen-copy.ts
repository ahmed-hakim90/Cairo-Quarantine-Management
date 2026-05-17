import type { Locale } from "@/lib/i18n/config";

export const queueCitizenCopy = {
  ar: {
    completedTitle: "تم الانتهاء من المكتب",
    completedBody: "لا حاجة للانتظار — يمكنك المغادرة.",
    queueNumberLabel: "رقم الدور",
    requestNumberLabel: "رقم الطلب",
    officeLabel: "المكتب",
    nameLabel: "الاسم",
    installAppTitle: "حمّل التطبيق لتنبيهات الدور",
    installAppBody:
      "ثبّت التطبيق على جوالك ليصلك تنبيه عندما يقترب دورك وعندما يحين دورك.",
    installAppButton: "تثبيت التطبيق الآن",
    installAppDismiss: "ليس الآن",
    installAppAria: "تثبيت تطبيق الحجر الصحي لتنبيهات الدور",
    notifyTitle: "تنبيهات الدور",
    notifyBody: "إشعار قبل 5 أشخاص وعند دورك.",
    notifyEnable: "تفعيل التنبيه",
    notifyEnabling: "جاري التفعيل…",
    notifyEnabled: "التنبيه مفعّل.",
    notifyUnsupported: "غير متاح هنا — تابع العد على الشاشة.",
    notifyDenied: "لم يُفعَّل. اسمح بالإشعارات أو ثبّت التطبيق من الأعلى.",
    notifyServerError: "تعذّر التفعيل. حاول مرة أخرى.",
    queueNumberHeading: "رقم الدور",
    aheadOfYou: "أمامك",
    person: "شخص",
    people: "أشخاص",
    yourTurnNow: "دورك الآن — توجه إلى الشباك",
    aheadYouOne: "أمامك شخص واحد",
    aheadYouMany: "أمامك {count} أشخاص",
    aheadInQueue: "في الطابور",
    updatingPosition: "جاري حساب موضعك في الطابور…",
    positionError: "تعذّر تحديث الطابور. انتظر قليلاً أو حدّث الصفحة.",
    queueDateLabel: "تاريخ اليوم",
  },
  en: {
    completedTitle: "Office visit complete",
    completedBody: "No need to wait — you may leave.",
    queueNumberLabel: "Queue number",
    requestNumberLabel: "Request ID",
    officeLabel: "Office",
    nameLabel: "Name",
    installAppTitle: "Install the app for queue alerts",
    installAppBody:
      "Install the app on your phone to get notified when your turn is approaching and when it is your turn.",
    installAppButton: "Install app now",
    installAppDismiss: "Not now",
    installAppAria: "Install the quarantine app for queue notifications",
    notifyTitle: "Queue alerts",
    notifyBody: "Alert when 5 are ahead and when it is your turn.",
    notifyEnable: "Enable alerts",
    notifyEnabling: "Enabling…",
    notifyEnabled: "Alerts enabled.",
    notifyUnsupported: "Not available here — watch the count on screen.",
    notifyDenied: "Not enabled. Allow notifications or install the app above.",
    notifyServerError: "Could not enable. Try again.",
    queueNumberHeading: "Queue number",
    aheadOfYou: "Ahead of you",
    person: "person",
    people: "people",
    yourTurnNow: "Your turn — go to the counter",
    aheadYouOne: "1 person ahead of you",
    aheadYouMany: "{count} people ahead of you",
    aheadInQueue: "In the queue",
    updatingPosition: "Calculating your place in line…",
    positionError: "Could not refresh the queue. Wait or reload the page.",
    queueDateLabel: "Today's date",
  },
  zh: {
    completedTitle: "办公室服务已完成",
    completedBody: "无需继续等待，可以离开。",
    queueNumberLabel: "排队号",
    requestNumberLabel: "申请编号",
    officeLabel: "办公室",
    nameLabel: "姓名",
    installAppTitle: "安装应用以接收排队提醒",
    installAppBody: "在手机上安装应用，以便在即将轮到您和轮到您时收到通知。",
    installAppButton: "立即安装应用",
    installAppDismiss: "暂不安装",
    installAppAria: "安装检疫应用以接收排队通知",
    notifyTitle: "排队提醒",
    notifyBody: "前方剩5人及轮到您时通知。",
    notifyEnable: "启用提醒",
    notifyEnabling: "正在启用…",
    notifyEnabled: "已启用。",
    notifyUnsupported: "此处不可用，请在页面查看排队。",
    notifyDenied: "未启用。请允许通知或安装上方应用。",
    notifyServerError: "启用失败，请重试。",
    queueNumberHeading: "排队号",
    aheadOfYou: "前方还有",
    person: "人",
    people: "人",
    yourTurnNow: "轮到您了 — 请前往窗口",
    aheadYouOne: "前方 1 人",
    aheadYouMany: "前方 {count} 人",
    aheadInQueue: "排队中",
    updatingPosition: "正在计算排队位置…",
    positionError: "无法更新排队信息，请稍后或刷新页面。",
    queueDateLabel: "今日日期",
  },
  fr: {
    completedTitle: "Visite au bureau terminee",
    completedBody: "Plus besoin d'attendre — vous pouvez partir.",
    queueNumberLabel: "Numero de file",
    requestNumberLabel: "Numero de demande",
    officeLabel: "Bureau",
    nameLabel: "Nom",
    installAppTitle: "Installez l'application pour les alertes de file",
    installAppBody:
      "Installez l'application sur votre telephone pour etre averti quand votre tour approche et quand c'est votre tour.",
    installAppButton: "Installer l'application",
    installAppDismiss: "Pas maintenant",
    installAppAria: "Installer l'application quarantaine pour les alertes de file",
    notifyTitle: "Alertes de file",
    notifyBody: "Alerte a 5 personnes et a votre tour.",
    notifyEnable: "Activer les alertes",
    notifyEnabling: "Activation…",
    notifyEnabled: "Alertes activees.",
    notifyUnsupported: "Indisponible ici — suivez le compteur a l'ecran.",
    notifyDenied: "Non active. Autorisez les notifications ou installez l'app ci-dessus.",
    notifyServerError: "Echec de l'activation. Reessayez.",
    queueNumberHeading: "Numero de file",
    aheadOfYou: "Devant vous",
    person: "personne",
    people: "personnes",
    yourTurnNow: "C'est votre tour — allez au guichet",
    aheadYouOne: "1 personne devant vous",
    aheadYouMany: "{count} personnes devant vous",
    aheadInQueue: "Dans la file",
    updatingPosition: "Calcul de votre place dans la file…",
    positionError: "Impossible d'actualiser la file. Patientez ou rechargez.",
    queueDateLabel: "Date du jour",
  },
} satisfies Record<
  Locale,
  Record<
    | "completedTitle"
    | "completedBody"
    | "queueNumberLabel"
    | "requestNumberLabel"
    | "officeLabel"
    | "nameLabel"
    | "installAppTitle"
    | "installAppBody"
    | "installAppButton"
    | "installAppDismiss"
    | "installAppAria"
    | "notifyTitle"
    | "notifyBody"
    | "notifyEnable"
    | "notifyEnabling"
    | "notifyEnabled"
    | "notifyUnsupported"
    | "notifyDenied"
    | "notifyServerError"
    | "queueNumberHeading"
    | "aheadOfYou"
    | "person"
    | "people"
    | "yourTurnNow"
    | "aheadYouOne"
    | "aheadYouMany"
    | "aheadInQueue"
    | "updatingPosition"
    | "positionError"
    | "queueDateLabel",
    string
  >
>;
