import type { Locale } from "@/lib/i18n/config";

export const queueCitizenCopy = {
  ar: {
    completedTitle: "تم الانتهاء من المكتب",
    completedBody:
      "لا حاجة للانتظار — يمكنك المغادرة. احفظ بطاقة طلبك أدناه إن احتجتها.",
    queueNumberLabel: "رقم الدور",
    requestNumberLabel: "رقم الطلب",
    officeLabel: "المكتب",
    nameLabel: "الاسم",
    saveRequestHint: "احفظ رقم طلبك للمتابعة لاحقاً:",
    myRequestsLink: "متابعة طلباتي",
    installAppTitle: "حمّل التطبيق لتنبيهات الدور",
    installAppBody:
      "ثبّت التطبيق على جوالك ليصلك تنبيه عندما يقترب دورك وعندما يحين دورك.",
    installAppButton: "تثبيت التطبيق الآن",
    installAppDismiss: "ليس الآن",
    installAppAria: "تثبيت تطبيق الحجر الصحي لتنبيهات الدور",
    notifyTitle: "التنبيهات",
    notifyBody:
      "عند بقاء 5 أشخاص أمامك وعند دورك، يصل إشعار على الموبايل. يفضّل تثبيت التطبيق أولاً على iPhone.",
    notifyEnable: "تفعيل التنبيهات",
    notifyEnabling: "جاري التفعيل…",
    notifyEnabled: "التنبيهات مفعّلة.",
    notifyUnsupported:
      "المتصفح لا يدعم الإشعارات — يمكنك متابعة «أمامك X» على هذه الشاشة.",
    queueNumberHeading: "رقم الدور",
    aheadOfYou: "أمامك",
    person: "شخص",
    people: "أشخاص",
    yourTurnNow: "دورك الآن — توجه إلى الشباك",
    updatingPosition: "جاري تحديث الموضع…",
    queueDateLabel: "تاريخ اليوم",
  },
  en: {
    completedTitle: "Office visit complete",
    completedBody:
      "No need to wait — you may leave. Save your request pass below if you need it.",
    queueNumberLabel: "Queue number",
    requestNumberLabel: "Request ID",
    officeLabel: "Office",
    nameLabel: "Name",
    saveRequestHint: "Save your request number for follow-up:",
    myRequestsLink: "My requests",
    installAppTitle: "Install the app for queue alerts",
    installAppBody:
      "Install the app on your phone to get notified when your turn is approaching and when it is your turn.",
    installAppButton: "Install app now",
    installAppDismiss: "Not now",
    installAppAria: "Install the quarantine app for queue notifications",
    notifyTitle: "Notifications",
    notifyBody:
      "You will be notified when 5 people are ahead and when it is your turn. On iPhone, install the app first.",
    notifyEnable: "Enable notifications",
    notifyEnabling: "Enabling…",
    notifyEnabled: "Notifications are enabled.",
    notifyUnsupported:
      "This browser does not support notifications — you can watch your position on this screen.",
    queueNumberHeading: "Queue number",
    aheadOfYou: "Ahead of you",
    person: "person",
    people: "people",
    yourTurnNow: "Your turn — go to the counter",
    updatingPosition: "Updating position…",
    queueDateLabel: "Today's date",
  },
  zh: {
    completedTitle: "办公室服务已完成",
    completedBody: "无需继续等待，可以离开。如需留存，请保存下方预约凭证。",
    queueNumberLabel: "排队号",
    requestNumberLabel: "申请编号",
    officeLabel: "办公室",
    nameLabel: "姓名",
    saveRequestHint: "请保存申请编号以便后续查询：",
    myRequestsLink: "我的申请",
    installAppTitle: "安装应用以接收排队提醒",
    installAppBody: "在手机上安装应用，以便在即将轮到您和轮到您时收到通知。",
    installAppButton: "立即安装应用",
    installAppDismiss: "暂不安装",
    installAppAria: "安装检疫应用以接收排队通知",
    notifyTitle: "通知",
    notifyBody: "当前方剩余5人及轮到您时将收到通知。iPhone请先安装应用。",
    notifyEnable: "启用通知",
    notifyEnabling: "正在启用…",
    notifyEnabled: "通知已启用。",
    notifyUnsupported: "此浏览器不支持通知，请在本页面查看排队位置。",
    queueNumberHeading: "排队号",
    aheadOfYou: "前方还有",
    person: "人",
    people: "人",
    yourTurnNow: "轮到您了 — 请前往窗口",
    updatingPosition: "正在更新位置…",
    queueDateLabel: "今日日期",
  },
  fr: {
    completedTitle: "Visite au bureau terminee",
    completedBody:
      "Plus besoin d'attendre — vous pouvez partir. Conservez votre pass ci-dessous si necessaire.",
    queueNumberLabel: "Numero de file",
    requestNumberLabel: "Numero de demande",
    officeLabel: "Bureau",
    nameLabel: "Nom",
    saveRequestHint: "Conservez votre numero de demande pour le suivi :",
    myRequestsLink: "Mes demandes",
    installAppTitle: "Installez l'application pour les alertes de file",
    installAppBody:
      "Installez l'application sur votre telephone pour etre averti quand votre tour approche et quand c'est votre tour.",
    installAppButton: "Installer l'application",
    installAppDismiss: "Pas maintenant",
    installAppAria: "Installer l'application quarantaine pour les alertes de file",
    notifyTitle: "Notifications",
    notifyBody:
      "Vous serez averti lorsqu'il reste 5 personnes devant vous et a votre tour. Sur iPhone, installez d'abord l'application.",
    notifyEnable: "Activer les notifications",
    notifyEnabling: "Activation…",
    notifyEnabled: "Notifications activees.",
    notifyUnsupported:
      "Ce navigateur ne prend pas en charge les notifications — suivez votre position sur cet ecran.",
    queueNumberHeading: "Numero de file",
    aheadOfYou: "Devant vous",
    person: "personne",
    people: "personnes",
    yourTurnNow: "C'est votre tour — allez au guichet",
    updatingPosition: "Mise a jour de la position…",
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
    | "saveRequestHint"
    | "myRequestsLink"
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
    | "queueNumberHeading"
    | "aheadOfYou"
    | "person"
    | "people"
    | "yourTurnNow"
    | "updatingPosition"
    | "queueDateLabel",
    string
  >
>;
