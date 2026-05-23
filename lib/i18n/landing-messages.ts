export type LandingMessages = {
  metaTitle: string;
  metaDescription: string;
  topBar: { platformName: string; logoAlt: string };
  hero: {
    title: string;
    subtitle: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    illustrationAria: string;
  };
  features: {
    heading: string;
    intro: string;
    items: [
      { title: string; description: string },
      { title: string; description: string },
      { title: string; description: string },
      { title: string; description: string },
      { title: string; description: string },
      { title: string; description: string },
    ];
  };
  stats: {
    heading: string;
    offices: string;
    services: string;
    dailyRequests: string;
    users: string;
    /** Illustrative until a public users metric exists */
    usersValue: number;
  };
  vision: {
    heading: string;
    intro: string;
    badges: [string, string, string, string];
    timeline: [
      { year: string; title: string; description: string },
      { year: string; title: string; description: string },
      { year: string; title: string; description: string },
      { year: string; title: string; description: string },
      { year: string; title: string; description: string },
    ];
  };
  offices: {
    heading: string;
    intro: string;
    colName: string;
    colLocation: string;
    colServices: string;
    colStatus: string;
    viewDetails: string;
    statusActive: string;
    statusInactive: string;
    serviceTravelers: string;
    serviceUmrahOnly: string;
    dialog: {
      title: string;
      phone: string;
      phoneMissing: string;
      hours: string;
      hoursMissing: string;
      maps: string;
      close: string;
    };
  };
  security: {
    heading: string;
    intro: string;
    items: [
      { title: string; description: string },
      { title: string; description: string },
      { title: string; description: string },
      { title: string; description: string },
    ];
  };
  footer: {
    copyright: string;
    privacy: string;
    privacyUnavailable: string;
    support: string;
    helpCenter: string;
    supportSectionId: string;
  };
  bottomNav: {
    home: string;
    services: string;
    offices: string;
    support: string;
    aria: string;
  };
};

export const landingAr: LandingMessages = {
  metaTitle: "منصة إدارة الحجر الصحي",
  metaDescription:
    "منصة رقمية متكاملة لإدارة خدمات الحجر الصحي والتحول الرقمي في محافظة القاهرة.",
  topBar: {
    platformName: "منصة إدارة الحجر الصحي",
    logoAlt: "شعار منصة إدارة الحجر الصحي",
  },
  hero: {
    title: "منصة إدارة الحجر الصحي",
    subtitle:
      "منصة رقمية متكاملة لإدارة خدمات الحجر الصحي والتحول الرقمي",
    description:
      "تسهيل الإجراءات الصحية وربط المكاتب والخدمات في منصة موحدة وآمنة",
    ctaPrimary: "دخول المنصة",
    ctaSecondary: "ابدأ الخدمة",
    illustrationAria: "رسم توضيحي لمبنى الحجر الصحي ومركبة طبية",
  },
  features: {
    heading: "مميزات المنصة",
    intro: "حلول رقمية متكاملة لإدارة الخدمات الصحية والمكاتب",
    items: [
      {
        title: "حجز الخدمات الصحية",
        description: "حجز المواعيد والخدمات الصحية إلكترونياً بسهولة وأمان.",
      },
      {
        title: "إدارة المكاتب",
        description: "توحيد إدارة مكاتب الحجر الصحي والبيانات التشغيلية.",
      },
      {
        title: "متابعة الإجراءات",
        description: "متابعة سير الإجراءات الصحية داخل المنصة بشفافية.",
      },
      {
        title: "الربط الرقمي",
        description: "ربط المكاتب والخدمات في منظومة رقمية موحدة.",
      },
      {
        title: "التحقق بالـ QR",
        description: "التحقق من الحجوزات والوثائق عبر رموز QR آمنة.",
      },
      {
        title: "لوحات متابعة ذكية",
        description: "لوحات معلومات لدعم القرار والمتابعة التشغيلية.",
      },
    ],
  },
  stats: {
    heading: "إحصائيات المنصة",
    offices: "عدد المكاتب",
    services: "الخدمات المتاحة",
    dailyRequests: "الطلبات اليومية",
    users: "المستخدمون",
    usersValue: 12500,
  },
  vision: {
    heading: "متوافق مع التحول الرقمي ورؤية مصر 2030",
    intro:
      "منصة حكومية رقمية تدعم التحول الإلكتروني وتحسين تجربة المتعاملين.",
    badges: ["حكومة إلكترونية", "تحول رقمي", "صحة رقمية", "خدمات موحدة"],
    timeline: [
      {
        year: "2020",
        title: "البنية الرقمية",
        description: "تأسيس البنية التحتية الرقمية للخدمات الصحية.",
      },
      {
        year: "2022",
        title: "المنصات الموحدة",
        description: "دمج الخدمات في بوابات موحدة للمتعاملين.",
      },
      {
        year: "2024",
        title: "الأمان والخصوصية",
        description: "تعزيز حماية البيانات والصلاحيات والتحقق الرقمي.",
      },
      {
        year: "2025",
        title: "الخدمات الذكية",
        description: "لوحات متابعة وحجز إلكتروني متقدم للمكاتب.",
      },
      {
        year: "2030",
        title: "رؤية مصر 2030",
        description: "استدامة التحول الرقمي في القطاع الصحي الحكومي.",
      },
    ],
  },
  offices: {
    heading: "المكاتب",
    intro: "مكاتب الحجر الصحي المعتمدة وخدماتها",
    colName: "اسم المكتب",
    colLocation: "الموقع",
    colServices: "الخدمات",
    colStatus: "الحالة",
    viewDetails: "عرض التفاصيل",
    statusActive: "نشط",
    statusInactive: "غير نشط",
    serviceTravelers: "حجاج ومعتمرين ومسافرين",
    serviceUmrahOnly: "حجاج ومعتمرين",
    dialog: {
      title: "تفاصيل المكتب",
      phone: "الهاتف",
      phoneMissing: "غير متوفر",
      hours: "مواعيد العمل",
      hoursMissing: "يرجى التواصل مع المكتب",
      maps: "الموقع على الخريطة",
      close: "إغلاق",
    },
  },
  security: {
    heading: "الأمان والخصوصية",
    intro: "معايير حكومية لحماية البيانات والوصول الآمن",
    items: [
      {
        title: "تشفير البيانات",
        description: "تشفير الاتصالات والبيانات الحساسة أثناء النقل والتخزين.",
      },
      {
        title: "صلاحيات المستخدمين",
        description: "تحكم دقيق بالأدوار والصلاحيات حسب المكتب والمهمة.",
      },
      {
        title: "حماية الخصوصية",
        description: "الالتزام بمعايير الخصوصية وحماية بيانات المتعاملين.",
      },
      {
        title: "QR Verification",
        description: "التحقق من صحة الحجوزات عبر رموز QR موثوقة.",
      },
    ],
  },
  footer: {
    copyright: "جميع الحقوق محفوظة — منصة إدارة الحجر الصحي بالقاهرة",
    privacy: "سياسة الخصوصية",
    privacyUnavailable: "سياسة الخصوصية — قريباً",
    support: "الدعم",
    helpCenter: "مركز المساعدة",
    supportSectionId: "support",
  },
  bottomNav: {
    home: "الرئيسية",
    services: "الخدمات",
    offices: "المكاتب",
    support: "الدعم",
    aria: "التنقل السريع",
  },
};

export const landingEn: LandingMessages = {
  metaTitle: "Quarantine Management Platform",
  metaDescription:
    "Integrated digital platform for quarantine services and digital transformation in Cairo.",
  topBar: {
    platformName: "Quarantine Management Platform",
    logoAlt: "Quarantine management platform logo",
  },
  hero: {
    title: "Quarantine Management Platform",
    subtitle:
      "An integrated digital platform for quarantine services and digital transformation",
    description:
      "Streamlining health procedures and connecting offices and services on one secure platform",
    ctaPrimary: "Enter platform",
    ctaSecondary: "Start service",
    illustrationAria: "Illustration of quarantine facility and medical vehicle",
  },
  features: {
    heading: "Platform features",
    intro: "Integrated digital solutions for health services and offices",
    items: [
      {
        title: "Health service booking",
        description: "Book appointments and health services online securely.",
      },
      {
        title: "Office management",
        description: "Unified management of quarantine offices and operations.",
      },
      {
        title: "Procedure tracking",
        description: "Transparent tracking of health procedures within the platform.",
      },
      {
        title: "Digital integration",
        description: "Connect offices and services in one digital ecosystem.",
      },
      {
        title: "QR verification",
        description: "Verify bookings and documents with secure QR codes.",
      },
      {
        title: "Smart dashboards",
        description: "Dashboards for operational monitoring and decisions.",
      },
    ],
  },
  stats: {
    heading: "Platform statistics",
    offices: "Offices",
    services: "Available services",
    dailyRequests: "Daily requests",
    users: "Users",
    usersValue: 12500,
  },
  vision: {
    heading: "Aligned with digital transformation and Egypt Vision 2030",
    intro:
      "A government digital platform supporting e-government and better citizen experience.",
    badges: ["E-government", "Digital transformation", "Digital health", "Unified services"],
    timeline: [
      {
        year: "2020",
        title: "Digital infrastructure",
        description: "Foundations for digital health service delivery.",
      },
      {
        year: "2022",
        title: "Unified portals",
        description: "Consolidating services into unified citizen portals.",
      },
      {
        year: "2024",
        title: "Security & privacy",
        description: "Stronger data protection, roles, and digital verification.",
      },
      {
        year: "2025",
        title: "Smart services",
        description: "Advanced booking and operational dashboards for offices.",
      },
      {
        year: "2030",
        title: "Egypt Vision 2030",
        description: "Sustainable digital transformation in government health.",
      },
    ],
  },
  offices: {
    heading: "Offices",
    intro: "Authorized quarantine offices and their services",
    colName: "Office name",
    colLocation: "Location",
    colServices: "Services",
    colStatus: "Status",
    viewDetails: "View details",
    statusActive: "Active",
    statusInactive: "Inactive",
    serviceTravelers: "Hajj, Umrah & travelers",
    serviceUmrahOnly: "Hajj & Umrah",
    dialog: {
      title: "Office details",
      phone: "Phone",
      phoneMissing: "Not available",
      hours: "Working hours",
      hoursMissing: "Please contact the office",
      maps: "View on map",
      close: "Close",
    },
  },
  security: {
    heading: "Security & privacy",
    intro: "Government-grade standards for data protection and access",
    items: [
      {
        title: "Data encryption",
        description: "Encryption of sensitive data in transit and at rest.",
      },
      {
        title: "User permissions",
        description: "Role-based access control by office and responsibility.",
      },
      {
        title: "Privacy protection",
        description: "Privacy standards and protection of citizen data.",
      },
      {
        title: "QR Verification",
        description: "Trusted QR verification for bookings.",
      },
    ],
  },
  footer: {
    copyright: "All rights reserved — Cairo Quarantine Management Platform",
    privacy: "Privacy policy",
    privacyUnavailable: "Privacy policy — coming soon",
    support: "Support",
    helpCenter: "Help center",
    supportSectionId: "support",
  },
  bottomNav: {
    home: "Home",
    services: "Services",
    offices: "Offices",
    support: "Support",
    aria: "Quick navigation",
  },
};

export const landingZh: LandingMessages = {
  ...landingEn,
  metaTitle: "检疫管理平台",
  metaDescription: "开罗检疫服务与数字化转型的综合数字平台。",
  topBar: { platformName: "检疫管理平台", logoAlt: "平台标志" },
  hero: {
    title: "检疫管理平台",
    subtitle: "检疫服务与数字化转型的综合数字平台",
    description: "简化卫生流程，在统一安全平台上连接办公室与服务",
    ctaPrimary: "进入平台",
    ctaSecondary: "开始服务",
    illustrationAria: "检疫设施与医疗车辆示意图",
  },
  features: {
    heading: "平台功能",
    intro: "卫生服务与办公室的一体化数字解决方案",
    items: landingEn.features.items.map((item, i) => ({
      ...item,
      title: [
        "预约卫生服务",
        "办公室管理",
        "流程跟踪",
        "数字互联",
        "二维码验证",
        "智能看板",
      ][i]!,
    })) as LandingMessages["features"]["items"],
  },
  stats: {
    heading: "平台统计",
    offices: "办公室数量",
    services: "可用服务",
    dailyRequests: "每日申请",
    users: "用户",
    usersValue: 12500,
  },
  vision: {
    ...landingEn.vision,
    heading: "符合数字化转型与埃及2030愿景",
    intro: "支持电子政务和改善办事体验的数字政府平台。",
    badges: ["电子政务", "数字化转型", "数字健康", "统一服务"],
  },
  offices: {
    ...landingEn.offices,
    heading: "办公室",
    intro: "授权检疫办公室及其服务",
    colName: "办公室名称",
    colLocation: "位置",
    colServices: "服务",
    colStatus: "状态",
    viewDetails: "查看详情",
    statusActive: "活跃",
    statusInactive: "未活跃",
    serviceTravelers: "朝觐、副朝与旅客",
    serviceUmrahOnly: "朝觐与副朝",
    dialog: {
      title: "办公室详情",
      phone: "电话",
      phoneMissing: "暂无",
      hours: "工作时间",
      hoursMissing: "请联系办公室",
      maps: "在地图上查看",
      close: "关闭",
    },
  },
  security: {
    heading: "安全与隐私",
    intro: "政府级数据保护与访问标准",
    items: [
      { title: "数据加密", description: "传输与存储中的敏感数据加密。" },
      { title: "用户权限", description: "按办公室与职责的精细角色控制。" },
      { title: "隐私保护", description: "隐私标准与公民数据保护。" },
      { title: "QR Verification", description: "通过可信二维码验证预约。" },
    ],
  },
  footer: {
    copyright: "版权所有 — 开罗检疫管理平台",
    privacy: "隐私政策",
    privacyUnavailable: "隐私政策 — 即将推出",
    support: "支持",
    helpCenter: "帮助中心",
    supportSectionId: "support",
  },
  bottomNav: {
    home: "首页",
    services: "服务",
    offices: "办公室",
    support: "支持",
    aria: "快速导航",
  },
};

export const landingFr: LandingMessages = {
  ...landingEn,
  metaTitle: "Plateforme de gestion de la quarantaine",
  metaDescription:
    "Plateforme numérique intégrée pour les services de quarantaine au Caire.",
  topBar: {
    platformName: "Plateforme de gestion de la quarantaine",
    logoAlt: "Logo de la plateforme",
  },
  hero: {
    title: "Plateforme de gestion de la quarantaine",
    subtitle:
      "Plateforme numérique intégrée pour les services de quarantaine et la transformation digitale",
    description:
      "Faciliter les procédures sanitaires et relier bureaux et services sur une plateforme sécurisée",
    ctaPrimary: "Accéder à la plateforme",
    ctaSecondary: "Commencer le service",
    illustrationAria: "Illustration d'un centre de quarantaine",
  },
  features: {
    heading: "Fonctionnalités",
    intro: "Solutions numériques pour les services de santé et les bureaux",
    items: [
      {
        title: "Réservation des services",
        description: "Prendre rendez-vous et réserver des services en ligne.",
      },
      {
        title: "Gestion des bureaux",
        description: "Gestion unifiée des bureaux de quarantaine.",
      },
      {
        title: "Suivi des procédures",
        description: "Suivi transparent des procédures sanitaires.",
      },
      {
        title: "Intégration numérique",
        description: "Relier bureaux et services dans un écosystème unique.",
      },
      {
        title: "Vérification QR",
        description: "Vérifier les réservations via des codes QR sécurisés.",
      },
      {
        title: "Tableaux de bord",
        description: "Tableaux pour le suivi opérationnel et les décisions.",
      },
    ],
  },
  stats: {
    heading: "Statistiques",
    offices: "Bureaux",
    services: "Services disponibles",
    dailyRequests: "Demandes quotidiennes",
    users: "Utilisateurs",
    usersValue: 12500,
  },
  vision: {
    heading: "Aligné avec la transformation digitale et la Vision Égypte 2030",
    intro:
      "Plateforme gouvernementale numérique pour l'e-gouvernement et l'expérience citoyenne.",
    badges: ["E-gouvernement", "Transformation digitale", "Santé numérique", "Services unifiés"],
    timeline: landingEn.vision.timeline.map((step, i) => ({
      ...step,
      title: [
        "Infrastructure numérique",
        "Portails unifiés",
        "Sécurité et confidentialité",
        "Services intelligents",
        "Vision Égypte 2030",
      ][i]!,
      description: [
        "Fondations pour la prestation numérique des services de santé.",
        "Regroupement des services dans des portails unifiés.",
        "Renforcement de la protection des données et des rôles.",
        "Réservation avancée et tableaux de bord opérationnels.",
        "Transformation digitale durable dans la santé publique.",
      ][i]!,
    })) as LandingMessages["vision"]["timeline"],
  },
  offices: {
    heading: "Bureaux",
    intro: "Bureaux de quarantaine agréés et leurs services",
    colName: "Nom du bureau",
    colLocation: "Emplacement",
    colServices: "Services",
    colStatus: "Statut",
    viewDetails: "Voir les détails",
    statusActive: "Actif",
    statusInactive: "Inactif",
    serviceTravelers: "Hajj, Omra et voyageurs",
    serviceUmrahOnly: "Hajj et Omra",
    dialog: {
      title: "Détails du bureau",
      phone: "Téléphone",
      phoneMissing: "Non disponible",
      hours: "Horaires",
      hoursMissing: "Veuillez contacter le bureau",
      maps: "Voir sur la carte",
      close: "Fermer",
    },
  },
  security: {
    heading: "Sécurité et confidentialité",
    intro: "Normes gouvernementales pour la protection des données",
    items: [
      {
        title: "Chiffrement des données",
        description: "Chiffrement des données sensibles en transit et au repos.",
      },
      {
        title: "Permissions utilisateurs",
        description: "Contrôle d'accès par rôle, bureau et responsabilité.",
      },
      {
        title: "Protection de la vie privée",
        description: "Normes de confidentialité et protection des données.",
      },
      {
        title: "QR Verification",
        description: "Vérification fiable des réservations par QR.",
      },
    ],
  },
  footer: {
    copyright:
      "Tous droits réservés — Plateforme de gestion de la quarantaine du Caire",
    privacy: "Politique de confidentialité",
    privacyUnavailable: "Politique de confidentialité — bientôt",
    support: "Assistance",
    helpCenter: "Centre d'aide",
    supportSectionId: "support",
  },
  bottomNav: {
    home: "Accueil",
    services: "Services",
    offices: "Bureaux",
    support: "Assistance",
    aria: "Navigation rapide",
  },
};
