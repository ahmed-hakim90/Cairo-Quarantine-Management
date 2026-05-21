import type { HealthGuidesMessages } from "@/lib/i18n/health-guides-content";
import {
  healthGuidesAr,
  healthGuidesEn,
  healthGuidesFr,
  healthGuidesZh,
} from "@/lib/i18n/health-guides-content";

export type Messages = {
  meta: { siteName: string; siteDescription: string };
  skipLink: string;
  nav: {
    subtitle: string;
    title: string;
    aria: string;
    home: string;
    international: string;
    hajjUmrah: string;
    citizen: string;
    charter: string;
    myRequests: string;
    switchToAr: string;
    switchToEn: string;
    switchToZh: string;
    switchToFr: string;
    switchLangAria: string;
    bookVaccination: string;
    bookVaccinationAria: string;
    mainMenuHeading: string;
    openMenuAria: string;
    closeMenuAria: string;
  };
  footer: {
    title: string;
    blurb: string;
    contactTitle: string;
    hotline: string;
    email: string;
    address: string;
    copyright: string;
    creditLinkLabel: string;
  };
  hero: {
    title: string;
    visionLabel: string;
    vision: string;
    missionLabel: string;
    mission: string;
  };
  services: {
    heading: string;
    intro: string;
    viewDetails: string;
    internationalTitle: string;
    internationalDesc: string;
    hajjTitle: string;
    hajjDesc: string;
    citizenTitle: string;
    citizenDesc: string;
  };
  vaccineSelector: {
    heading: string;
    intro: string;
    userType: string;
    vaccine: string;
    vaccinesDropdownHint: string;
    vaccinesSummaryNone: string;
    vaccinesSummaryCount: string;
    vaccinesTotal: string;
    vaccinesEmptySelection: string;
    guidancePrice: string;
    free: string;
    currency: string;
    footnote: string;
    categories: {
      international: string;
      hajj: string;
      umrah: string;
      citizen: string;
    };
  };
  importantLinks: {
    heading: string;
    pdf: string;
    hajjInstructions: string;
    mosquitoPrevention: string;
  };
  healthGuides: HealthGuidesMessages;
  locations: {
    heading: string;
    introLead: string;
    introHighlight: string;
    caption: string;
    colOffice: string;
    colAdmin: string;
    colGov: string;
    colAddress: string;
    colPhone: string;
    colMaps: string;
    mapsLink: string;
    a11yPhone: string;
    a11yMap: string;
  };
  hajjTable: {
    heading: string;
    intro: string;
    caption: string;
    colGov: string;
    colAdmin: string;
    colSerial: string;
    colOffice: string;
    colAddress: string;
    colHours: string;
    colPhone: string;
    colMaps: string;
    colService: string;
    mapsLink: string;
    governorate: string;
    phoneMissing: string;
    serviceTravelers: string;
    serviceUmrahOnly: string;
    a11yPhone: string;
    a11yMap: string;
    a11yPhoneUnavailable: string;
  };
  pages: {
    international: {
      metaTitle: string;
      heading: string;
      description: string;
      beforeTravel: string;
      bullets: [string, string, string];
      destinationVaccinesIntro: string;
      countryRequirements: {
        searchPlaceholder: string;
        selectAria: string;
        listAria: string;
        requirementsHeading: string;
        noResults: string;
        emptyCatalog: string;
      };
    };
    hajj: {
      metaTitle: string;
      heading: string;
      description: string;
      beforeTravel: string;
      documentBullets: [string, string, string];
      basicsTitle: string;
      basicsBody: string;
      pricing: {
        sectionTitle: string;
        tripTypeLabel: string;
        tripHajj: string;
        tripUmrah: string;
        guidancePrice: string;
        fluDisclaimer: string;
        locationsTitle: string;
        locationsBody: string;
      };
    };
    citizen: {
      metaTitle: string;
      heading: string;
      description: string;
      vaccineTitle: string;
      vaccineBody: string;
      docsTitle: string;
      docsBullets: [string, string, string];
      notesTitle: string;
      notesBody: string;
      splenectomyNote: string;
    };
    charter: {
      metaTitle: string;
      heading: string;
      description: string;
      tocTitle: string;
    };
  };
  chat: {
    title: string;
    subtitle: string;
    greeting: string;
    placeholder: string;
    send: string;
    openAria: string;
    closeAria: string;
    error: string;
  };
  tts: {
    read: string;
    pause: string;
    resume: string;
    stop: string;
    unsupported: string;
  };
  pwa: {
    installTitle: string;
    installBody: string;
    installButton: string;
    installDismiss: string;
    iosHelp: string;
    installAria: string;
  };
};

const ar: Messages = {
  meta: {
    siteName: "إدارة الحجر الصحي بالقاهرة",
    siteDescription:
      "البوابة الرسمية لخدمات الحجر الصحي والتطعيمات للمسافرين والمواطنين بمحافظة القاهرة والمرافق التابعة.",
  },
  skipLink: "تخطي إلى المحتوى الرئيسي",
  nav: {
    subtitle: " ",
    title: "إدارة الحجر الصحي بالقاهرة",
    aria: "التنقل الرئيسي",
    home: "الرئيسية",
    international: "مسافر دولي",
    hajjUmrah: "الحج والعمرة",
    citizen: "خدمات المواطنين",
    charter: " ميثاق",
    myRequests: "طلباتي",
    switchToAr: "العربية",
    switchToEn: "English",
    switchToZh: "中文",
    switchToFr: "Français",
    switchLangAria: "تغيير اللغة",
    bookVaccination: "حجز موعد تطعيم / شكوى",
    bookVaccinationAria:
      "فتح شاشة حجز موعد تطعيم أو تقديم شكوى بإدارة الحجر الصحي بالقاهرة",
    mainMenuHeading: "القائمة",
    openMenuAria: "فتح قائمة التنقل الرئيسية",
    closeMenuAria: "إغلاق قائمة التنقل",
  },
  footer: {
    title: "إدارة الحجر الصحي بالقاهرة",
    blurb:
      "بوابة معلومات رسمية للمسافرين والمواطنين. للاستفسارات الطارئة يرجى التواصل عبر الخطوط المعتمدة أو زيارة أقرب مركز تطعيم معتمد.",
    contactTitle: "معلومات الاتصال (عرض توضيحي)",
    hotline: "الخط الساخن: ١٦٥٢٨ — على مدار الساعة",
    email: "البريد الإلكتروني: cairovirology@gmail.com",
    address: "العنوان: القاهرة، جمهورية مصر العربية",
    copyright:
      "جميع الحقوق محفوظة. المحتوى المعروض للتوعية ولا يغني عن التوجيه الطبي المباشر.",
    creditLinkLabel: "صنع ب ❣️ HAKIMO",
  },
  hero: {
    title: "إدارة الحجر الصحي بالقاهرة",
    visionLabel: "رؤيتنا:",
    vision:
      "الريادة في تقديم خدمات تطعيم المسافرين بكفاءة وجودة عالية لضمان سفر آمن وصحي.",
    missionLabel: "رسالتنا:",
    mission:
      "تقديم خدمات التطعيم والاستشارات الوقائية للمسافرين بطريقة آمنة تحقق رضا المتعاملين وتدعم الصحة العامة.",
  },
  services: {
    heading: "الخدمات الرئيسية",
    intro:
      "اختر المسار المناسب للاطلاع على المتطلبات والأسعار التوجيهية للقاحات.",
    viewDetails: "عرض التفاصيل",
    internationalTitle: "مسافر دولي",
    internationalDesc:
      "التطعيمات والإجراءات الصحية للسفر خارج البلاد أو العودة من الخارج.",
    hajjTitle: "مسافر للحج / العمرة",
    hajjDesc:
      "المتطلبات الصحية المعتمدة للحج والعمرة والمواعيد الإرشادية.",
    citizenTitle: "مواطن",
    citizenDesc:
      "خدمات التطعيم والتوعية الصحية للمواطنين داخل الجمهورية.",
  },
  vaccineSelector: {
    heading: "استعلام القاحات والتكلفة التوجيهية",
    intro:
      "اختر الفئة ثم افتح قائمة اللقاحات وحدد لقاحاً واحداً أو أكثر لعرض الأسعار التوجيهية والإجمالي. قد تختلف التكلفة الفعلية بحسب السياسات المحدثة  ",
    userType: "نوع المستخدم",
    vaccine: "اللقاحات",
    vaccinesDropdownHint: "افتح القائمة وحدد لقاحاً واحداً أو أكثر.",
    vaccinesSummaryNone: "اختر اللقاحات…",
    vaccinesSummaryCount: "{count} لقاح محدد",
    vaccinesTotal: "الإجمالي التوجيهي",
    vaccinesEmptySelection:
      "لم يُحدد أي لقاح — افتح القائمة أعلاه واختر لقاحاً واحداً أو أكثر.",
    guidancePrice: "التكلفة التوجيهية",
    free: "مجاناً",
    currency: "جنيه مصري",
    footnote:
      "للحجز والدفع، يرجى مراجعة المركز المعتمد أو القنوات الرسمية عند ربط النظام بالخدمات الإلكترونية لاحقاً.",
    categories: {
      international: "مسافر دولي",
      hajj: "حج",
      umrah: "عمرة",
      citizen: "مواطن",
    },
  },
  importantLinks: {
    heading: "روابط مهمة",
    pdf: "الدليل الصحي (PDF)",
    hajjInstructions: "تعليمات الحج والعمرة",
    mosquitoPrevention:
      "الوقاية من لدغات البعوض والأمراض المنقولة عن طريقها",
  },
  healthGuides: healthGuidesAr,
  locations: {
    heading: "مراكز التطعيم المعتمدة",
    introLead: "قائمة مكاتب تطعيم المسافرين بالقاهرة لعام ٢٠٢٦ — خدمات",
    introHighlight: "حجاج ومعتمرين ومسافرين",
    caption:
      "جدول مكاتب التطعيم المعتمدة بالقاهرة: اسم المكتب، الإدارة، المحافظة، العنوان، الهاتف، رابط الموقع",
    colOffice: "اسم المكتب",
    colAdmin: "الإدارة",
    colGov: "المحافظة",
    colAddress: "العنوان",
    colPhone: "الهاتف",
    colMaps: "الموقع",
    mapsLink: "خريطة Google",
    a11yPhone: "اتصال هاتفي بهذا المكتب",
    a11yMap: "فتح موقع المكتب على الخريطة",
  },
  hajjTable: {
    heading: "قائمة مكاتب تطعيم المسافرين بالقاهرة لعام 2026",
    intro:
      "البيانات معروضة للتوجيه؛ يُرجى التحقق من المواعيد والخدمات عبر القنوات الرسمية لوزارة الصحة قبل الحضور.",
    caption:
      "مكاتب تطعيم المسافرين في محافظة القاهرة مع الإدارة والعنوان والهاتف ورابط الخرائط ونوع الخدمة",
    colGov: "المحافظة",
    colAdmin: "الإدارة",
    colSerial: "م. المحافظة",
    colOffice: "اسم المكتب",
    colAddress: "عنوان المكتب",
    colHours: "مواعيد العمل",
    colPhone: "رقم التليفون",
    colMaps: "الموقع",
    colService: "نوع الخدمة",
    mapsLink: "خرائط Google",
    governorate: "القاهرة",
    phoneMissing: "——",
    serviceTravelers: "حجاج ومعتمرين ومسافرين",
    serviceUmrahOnly: "حجاج ومعتمرين فقط",
    a11yPhone: "اتصال هاتفي بهذا المكتب",
    a11yMap: "فتح موقع المكتب على الخريطة",
    a11yPhoneUnavailable: "لا يتوفر رقم هاتف مسجل لهذا المكتب",
  },
  pages: {
    international: {
      metaTitle: "مسافر دولي",
      heading: "خدمات المسافرين الدوليين",
      description:
        "إرشادات رسمية حول التطعيمات  وفق وجهة السفر وحالة الوصول إلى جمهورية مصر العربية. يرجى التحقق من آخر التحديثات الصادرة عن الجهات المختصة قبل السفر.",
      beforeTravel: "قبل السفر",
      bullets: [
        "أحضر جواز سفر ساريًا — للمسافر الدولي",
        "بطاقة الرقم القومي سارية",
        "في حالة تطعيم الملاريا . احضار ما يثبت السفر للدولة ( تذكرة الطائرة . صورة التأشيرة )",
      ],
      destinationVaccinesIntro:
        "لمعرفة طعوم الدولة المتجه إليها، ابحث عن الدولة واخترها من القائمة:",
      countryRequirements: {
        searchPlaceholder: "ابحث باسم الدولة (عربي أو إنجليزي)…",
        selectAria: "اختيار دولة الوجهة",
        listAria: "نتائج البحث عن الدول",
        requirementsHeading: "متطلبات التطعيم",
        noResults: "لا توجد دولة مطابقة.",
        emptyCatalog: "قائمة الدول غير متوفرة حالياً.",
      },
    },
    hajj: {
      metaTitle: "الحج والعمرة",
      heading: "الحج والعمرة — المتطلبات الصحية",
      description:
        "تنظم هذه الصفحة المعلومات التوجيهية الخاصة بالتطعيمات المعتمدة للحج والعمرة. يجب الالتزام بالقرارات الرسمية الصادرة عن وزارة الصحة والجهات  المختصة.",
      beforeTravel: "قبل السفر",
      documentBullets: [
        "جواز سفر ساري — لرحلة الحج أو العمرة",
        "بطاقة الرقم القومي سارية",
        "صورة شخصية حديثة",
      ],
      basicsTitle: "التطعيمات الأساسية",
      basicsBody:
        "يُطلب عادةً استكمال تطعيم التهاب السحايا وفق اللقاحات المعتمدة، مع الاحتفاظ بشهادة معتمدة تُعرض عند السفر. قد تُحدَّث القائمة وفق الموسم؛ يُرجى متابعة الإعلانات الرسمية.",
      pricing: {
        sectionTitle: "التكلفة التوجيهية حسب نوع الرحلة",
        tripTypeLabel: "نوع الرحلة",
        tripHajj: "حج",
        tripUmrah: "عمرة",
        guidancePrice: "التكلفة التوجيهية",
        fluDisclaimer:
          "حيث ان لقاح الانفلونزا لقاح موسمي ويوصى به حال توفره",
        locationsTitle: "أماكن تقديم الخدمة",
        locationsBody:
          "الخدمة متاحة في جميع الأماكن المعتمدة.",
      },
    },
    citizen: {
      metaTitle: "خدمات المواطنين",
      heading: "خدمات المواطنين",
      description:
        "معلومات موجهة للمواطنين داخل الجمهورية حول التطعيمات المتاحة والأسعار التوجيهية. الخدمات الفعلية والمواعيد تُحدَّد عبر المراكز المعتمدة والقنوات الرسمية.",
      vaccineTitle: "التطعيم المتاح للمواطنين",
      vaccineBody:
        "للمواطنين: ",
      docsTitle: "الوثائق المطلوبة",
      docsBullets: [
        "بطاقة الرقم القومي سارية",
        "جواز سفر ساري — عند طلب خدمات مرتبطة بالسفر الدولي فقط",
        "صورة شخصية حديثة",
      ],
      notesTitle: "ملاحظات عامة",
      notesBody:
        "يرجى مراجعة المركز المعتمد أو القنوات الرسمية لوزارة الصحة لتأكيد المواعيد والخدمات الفعلية.",
      splenectomyNote:
        "إذا قمت بإجراء عملية استئصال طحال أو أي إجراء يتطلب إعادة التحصين ببعض التطعيمات، لا تترد في الاستفسار من خلال الواتساب، أو يمكنكم التوجه لأقرب مكتب تحصين مسافرين لتلقي المعلومات الكاملة لهذا الشأن.\nولا تنسَ إحضار تقريرك الطبي.\nدمتم سالمين 🌻",
    },
    charter: {
      metaTitle: "ميثاق المتعاملين — مكتب تطعيمات المسافرين",
      heading: "ميثاق المتعاملين",
      description:
        "ميثاق مكتب تطعيمات المسافرين: التزامات المكتب وحقوق وواجبات المتعاملين وآلية الشكاوى والمقترحات.",
      tocTitle: "في هذه الوثيقة",
    },
  },
  chat: {
    title: "مساعد المنصة",
    subtitle: "إدارة الحجر الصحي بالقاهرة",
    greeting:
      "مساعد منصة الحجر الصحي. اسأل عن الخدمات أو الحجز أو المكاتب.",
    placeholder: "اكتب سؤالك...",
    send: "إرسال",
    openAria: "فتح المساعد",
    closeAria: "إغلاق المساعد",
    error:
      "تعذر الرد الآن. للمساعدة يرجى التواصل عبر واتساب من الزر الأخضر بالأسفل.",
  },
  tts: {
    read: "اقرأ لي المحتوى",
    pause: "إيقاف مؤقت للقراءة",
    resume: "استئناف القراءة",
    stop: "إيقاف القراءة",
    unsupported: "القراءة الصوتية غير مدعومة في هذا المتصفح",
  },
  pwa: {
    installTitle: "ثبّت تطبيق الحجر الصحي",
    installBody:
      "وصول أسرع لخدمات التطعيمات والميثاق وبيانات المكاتب من شاشتك الرئيسية.",
    installButton: "تثبيت التطبيق",
    installDismiss: "ليس الآن",
    iosHelp:
      "للتثبيت على iPhone: اضغط زر «المشاركة» في Safari ثم اختر «أضف إلى الشاشة الرئيسية».",
    installAria: "اقتراح تثبيت التطبيق على الجهاز",
  },
};

const en: Messages = {
  meta: {
    siteName: "Cairo Quarantine Administration",
    siteDescription:
      "Official portal for quarantine services and traveller vaccinations in Cairo Governorate and affiliated facilities.",
  },
  skipLink: "Skip to main content",
  nav: {
    subtitle: "Public health authority — Arab Republic of Egypt",
    title: "Cairo Quarantine Administration",
    aria: "Main navigation",
    home: "Home",
    international: "International traveller",
    hajjUmrah: "Hajj & Umrah",
    citizen: "Citizen services",
    charter: "Stakeholder charter",
    myRequests: "My requests",
    switchToAr: "العربية",
    switchToEn: "English",
    switchToZh: "中文",
    switchToFr: "Français",
    switchLangAria: "Change language",
    bookVaccination: "Book vaccination",
    bookVaccinationAria:
      "Open the Cairo Quarantine Administration vaccination booking screen",
    mainMenuHeading: "Menu",
    openMenuAria: "Open main navigation menu",
    closeMenuAria: "Close navigation menu",
  },
  footer: {
    title: "Cairo Quarantine Administration",
    blurb:
      "Official information portal for travellers and citizens. For urgent enquiries, use approved hotlines or visit the nearest authorised vaccination centre.",
    contactTitle: "Contact information (sample)",
    hotline: "Hotline: 16528 — 24/7",
    email: "Email: info@cqm.gov.eg",
    address: "Address: Cairo, Arab Republic of Egypt",
    copyright:
      "All rights reserved. Content is for awareness only and does not replace direct medical advice.",
    creditLinkLabel: "Crafted with care by Hakim",
  },
  hero: {
    title: "Cairo Quarantine Administration",
    visionLabel: "Our vision:",
    vision:
      "To lead in delivering traveller vaccination services with efficiency and high quality, ensuring safe and healthy travel.",
    missionLabel: "Our mission:",
    mission:
      "Provide vaccination and preventive consultation services to travellers in a safe way that achieves stakeholder satisfaction and supports public health.",
  },
  services: {
    heading: "Main services",
    intro:
      "Choose the path that fits you to review requirements and indicative vaccine prices.",
    viewDetails: "View details",
    internationalTitle: "International traveller",
    internationalDesc:
      "Vaccinations and health measures for travel abroad or return to Egypt.",
    hajjTitle: "Hajj / Umrah traveller",
    hajjDesc:
      "Approved health requirements for Hajj and Umrah plus indicative timelines.",
    citizenTitle: "Citizen",
    citizenDesc:
      "Vaccination services and health awareness for residents inside Egypt.",
  },
  vaccineSelector: {
    heading: "Vaccine lookup & indicative cost",
    intro:
      "Pick an audience, open the vaccine list, and select one or more vaccines to see line prices and an indicative total. Actual cost may vary with updated policies or insurance coverage.",
    userType: "Audience",
    vaccine: "Vaccines",
    vaccinesDropdownHint: "Open the list and tick one or more vaccines.",
    vaccinesSummaryNone: "Choose vaccines…",
    vaccinesSummaryCount: "{count} vaccines selected",
    vaccinesTotal: "Indicative total",
    vaccinesEmptySelection:
      "No vaccines selected — open the list above and choose one or more.",
    guidancePrice: "Indicative cost",
    free: "Free",
    currency: "EGP",
    footnote:
      "For booking and payment, visit an authorised centre or official channels when electronic services are connected later.",
    categories: {
      international: "International traveller",
      hajj: "Hajj",
      umrah: "Umrah",
      citizen: "Citizen",
    },
  },
  importantLinks: {
    heading: "Important links",
    pdf: "Health guide (PDF)",
    hajjInstructions: "Hajj & Umrah instructions",
    mosquitoPrevention:
      "Mosquito bites & vector-borne disease prevention",
  },
  healthGuides: healthGuidesEn,
  locations: {
    heading: "Approved vaccination centres",
    introLead:
      "Traveller vaccination offices in Cairo for 2026 — services for",
    introHighlight: "Hajj, Umrah & international travellers",
    caption:
      "Table of approved vaccination offices in Cairo: office name, administration, governorate, address, phone, map link",
    colOffice: "Office name",
    colAdmin: "Administration",
    colGov: "Governorate",
    colAddress: "Address",
    colPhone: "Phone",
    colMaps: "Map",
    mapsLink: "Google Maps",
    a11yPhone: "Call this office by phone",
    a11yMap: "Open this office location on the map",
  },
  hajjTable: {
    heading:
      "Cairo traveller vaccination offices — 2026 (reference list)",
    intro:
      "Data is for guidance; confirm schedules and services through official Ministry of Health channels before visiting.",
    caption:
      "Traveller vaccination offices in Cairo Governorate with administration, address, phone, map link, and service type",
    colGov: "Governorate",
    colAdmin: "Administration",
    colSerial: "No. in governorate",
    colOffice: "Office name",
    colAddress: "Office address",
    colHours: "Working hours",
    colPhone: "Phone",
    colMaps: "Map",
    colService: "Service type",
    mapsLink: "Google Maps",
    governorate: "Cairo",
    phoneMissing: "—",
    serviceTravelers: "Hajj, Umrah & travellers",
    serviceUmrahOnly: "Hajj & Umrah only",
    a11yPhone: "Call this office by phone",
    a11yMap: "Open this office location on the map",
    a11yPhoneUnavailable: "No phone number on file for this office",
  },
  pages: {
    international: {
      metaTitle: "International traveller",
      heading: "International traveller services",
      description:
        "Official guidance on vaccinations and tests required by destination and entry rules for Egypt. Always confirm the latest updates from competent authorities before travel.",
      beforeTravel: "Before you travel",
      bullets: [
        "Valid passport — international travellers",
        "Valid national ID card",
        "Recent passport-style photo",
      ],
      destinationVaccinesIntro:
        "To see vaccines required for your destination, search and select your country:",
      countryRequirements: {
        searchPlaceholder: "Search country name (Arabic or English)…",
        selectAria: "Select destination country",
        listAria: "Country search results",
        requirementsHeading: "Vaccination requirements",
        noResults: "No matching country.",
        emptyCatalog: "Country list is not available yet.",
      },
    },
    hajj: {
      metaTitle: "Hajj & Umrah",
      heading: "Hajj & Umrah — health requirements",
      description:
        "This page summarises guidance on approved vaccinations for Hajj and Umrah. Follow official decisions from Egypt’s Ministry of Health and other authorities.",
      beforeTravel: "Before you travel",
      documentBullets: [
        "Valid passport for your Hajj or Umrah journey",
        "Valid national ID card",
        "Recent passport-style photograph",
      ],
      basicsTitle: "Core vaccinations",
      basicsBody:
        "Meningitis vaccination is commonly required with an approved certificate for travel. The list may change by season — follow official announcements.",
      pricing: {
        sectionTitle: "Indicative cost by trip type",
        tripTypeLabel: "Trip type",
        tripHajj: "Hajj",
        tripUmrah: "Umrah",
        guidancePrice: "Indicative cost",
        fluDisclaimer:
          "These prices do not include the seasonal influenza vaccine, which is optional.",
        locationsTitle: "Where services are provided",
        locationsBody:
          "Services are available at all authorised locations .",
      },
    },
    citizen: {
      metaTitle: "Citizen services",
      heading: "Citizen services",
      description:
        "Information for residents on available vaccines and indicative prices. Actual services and appointments are set by authorised centres and official channels.",
      vaccineTitle: "Vaccination for citizens",
      vaccineBody:
        "For citizens: bivalent meningococcal vaccine 200 EGP; seasonal influenza 260 EGP; hepatitis vaccines by type — Egyptian 100 EGP, foreign 200 EGP, Egyptian travelling abroad 150 EGP, foreign traveller 300 EGP (indicative prices; use the home-page lookup for details).",
      docsTitle: "Documents to bring",
      docsBullets: [
        "Valid national ID card",
        "Valid passport — only if the vaccination or service is linked to international travel",
        "Recent passport-style photograph",
      ],
      notesTitle: "General notes",
      notesBody:
        "Confirm appointment times and available services with your authorised centre or official Ministry of Health channels.",
      splenectomyNote:
        "If you have undergone a splenectomy or any procedure that requires re-vaccination, do not hesitate to enquire via WhatsApp or visit your nearest traveller vaccination office for full information on this matter.\nDon't forget to bring your medical report.\nStay safe 🌻",
    },
    charter: {
      metaTitle: "Stakeholder charter — Travel vaccinations office",
      heading: "Stakeholder charter",
      description:
        "Charter of the travel vaccinations office: commitments to the public, stakeholder rights and duties, and how complaints and suggestions are handled.",
      tocTitle: "In this document",
    },
  },
  chat: {
    title: "Portal assistant",
    subtitle: "Cairo Quarantine Administration",
    greeting:
      "Cairo Quarantine portal assistant. Ask about services, booking, or offices.",
    placeholder: "Type your question...",
    send: "Send",
    openAria: "Open assistant",
    closeAria: "Close assistant",
    error:
      "Could not reply now. For help, contact us via the green WhatsApp button below.",
  },
  tts: {
    read: "Read page aloud",
    pause: "Pause reading",
    resume: "Resume reading",
    stop: "Stop reading",
    unsupported: "Text-to-speech is not supported in this browser",
  },
  pwa: {
    installTitle: "Install the Quarantine app",
    installBody:
      "Add it to your home screen for faster access to vaccinations, the charter and office details.",
    installButton: "Install app",
    installDismiss: "Not now",
    iosHelp:
      "To install on iPhone: tap the Share button in Safari, then choose “Add to Home Screen”.",
    installAria: "Install app suggestion",
  },
};

const zh: Messages = {
  meta: {
    siteName: "开罗检疫管理处",
    siteDescription:
      "开罗省及所属机构的检疫服务与旅客疫苗接种官方门户。",
  },
  skipLink: "跳至主要内容",
  nav: {
    subtitle: "公共卫生机构 — 阿拉伯埃及共和国",
    title: "开罗检疫管理处",
    aria: "主导航",
    home: "首页",
    international: "国际旅客",
    hajjUmrah: "朝觐与副朝",
    citizen: "公民服务",
    charter: "利益相关方章程",
    myRequests: "我的申请",
    switchToAr: "العربية",
    switchToEn: "English",
    switchToZh: "中文",
    switchToFr: "Français",
    switchLangAria: "切换语言",
    bookVaccination: "预约接种",
    bookVaccinationAria: "打开开罗检疫管理处疫苗预约页面",
    mainMenuHeading: "菜单",
    openMenuAria: "打开主导航菜单",
    closeMenuAria: "关闭导航菜单",
  },
  footer: {
    title: "开罗检疫管理处",
    blurb:
      "面向旅客与公民的官方信息门户。紧急咨询请拨打指定热线或前往最近的授权接种中心。",
    contactTitle: "联系方式（示例）",
    hotline: "热线：16528 — 全天候",
    email: "邮箱：info@cqm.gov.eg",
    address: "地址：埃及开罗",
    copyright:
      "保留所有权利。内容仅供宣传参考，不能替代直接医疗建议。",
    creditLinkLabel: "哈基姆用心制作",
  },
  hero: {
    title: "开罗检疫管理处",
    visionLabel: "我们的愿景：",
    vision:
      "以高效、高质量的旅客疫苗接种服务领先同行，保障安全、健康的出行。",
    missionLabel: "我们的使命：",
    mission:
      "以安全的方式为旅客提供接种与预防咨询服务，提升服务对象满意度并支持公共卫生。",
  },
  services: {
    heading: "主要服务",
    intro: "请选择适合您的路径，查看要求与疫苗参考价格。",
    viewDetails: "查看详情",
    internationalTitle: "国际旅客",
    internationalDesc: "出境或入境埃及所需的疫苗接种与健康措施。",
    hajjTitle: "朝觐 / 副朝旅客",
    hajjDesc: "朝觐与副朝的获批卫生要求及参考时间安排。",
    citizenTitle: "公民",
    citizenDesc: "面向埃及境内居民的疫苗接种服务与健康宣传。",
  },
  vaccineSelector: {
    heading: "疫苗查询与参考价格",
    intro:
      "选择人群后打开疫苗列表，可勾选一种或多种疫苗查看分项价格与参考合计。实际费用可能因政策更新或保险覆盖而有所不同。",
    userType: "人群",
    vaccine: "疫苗（可多选）",
    vaccinesDropdownHint: "展开列表并勾选一种或多种疫苗。",
    vaccinesSummaryNone: "请选择疫苗…",
    vaccinesSummaryCount: "已选 {count} 项",
    vaccinesTotal: "参考合计",
    vaccinesEmptySelection: "尚未选择疫苗 — 请展开上方列表并勾选一项或多项。",
    guidancePrice: "参考价格",
    free: "免费",
    currency: "埃及镑",
    footnote:
      "预约与缴费请前往授权中心或官方渠道（后续若接入线上服务以官方通知为准）。",
    categories: {
      international: "国际旅客",
      hajj: "朝觐",
      umrah: "副朝",
      citizen: "公民",
    },
  },
  importantLinks: {
    heading: "重要链接",
    pdf: "健康指南（PDF）",
    hajjInstructions: "朝觐与副朝须知",
    mosquitoPrevention: "蚊虫叮咬与媒介传播疾病预防",
  },
  healthGuides: healthGuidesZh,
  locations: {
    heading: "授权接种中心",
    introLead: "开罗2026年旅客接种门诊列表 — 服务对象：",
    introHighlight: "朝觐、副朝与国际旅客",
    caption:
      "开罗授权接种门诊表：门诊名称、管理机构、省、地址、电话、地图链接",
    colOffice: "门诊名称",
    colAdmin: "管理机构",
    colGov: "省",
    colAddress: "地址",
    colPhone: "电话",
    colMaps: "地图",
    mapsLink: "Google 地图",
    a11yPhone: "拨打此门诊电话",
    a11yMap: "在地图上打开此门诊位置",
  },
  hajjTable: {
    heading: "开罗旅客接种门诊 — 2026（参考清单）",
    intro:
      "数据仅供参考；到访前请通过卫生部官方渠道确认时间与开放服务。",
    caption:
      "开罗省旅客接种门诊：管理机构、地址、电话、地图链接与服务类型",
    colGov: "省",
    colAdmin: "管理机构",
    colSerial: "省内序号",
    colOffice: "门诊名称",
    colAddress: "门诊地址",
    colHours: "营业时间",
    colPhone: "电话",
    colMaps: "地图",
    colService: "服务类型",
    mapsLink: "Google 地图",
    governorate: "开罗",
    phoneMissing: "—",
    serviceTravelers: "朝觐、副朝及旅客",
    serviceUmrahOnly: "仅朝觐与副朝",
    a11yPhone: "拨打此门诊电话",
    a11yMap: "在地图上打开此门诊位置",
    a11yPhoneUnavailable: "此门诊无登记电话号码",
  },
  pages: {
    international: {
      metaTitle: "国际旅客",
      heading: "国际旅客服务",
      description:
        "关于按目的地与入境埃及规定所需的疫苗与检测的官方说明。出行前请务必向主管部门核实最新要求。",
      beforeTravel: "出行前",
      bullets: [
        "有效护照 — 国际旅客",
        "有效国民身份证",
        "近照证件照",
      ],
      destinationVaccinesIntro:
        "如需了解目的地所需疫苗，请搜索并选择国家：",
      countryRequirements: {
        searchPlaceholder: "搜索国家名称（中文界面仍可用英文或阿拉伯文国名）…",
        selectAria: "选择目的地国家",
        listAria: "国家搜索结果",
        requirementsHeading: "疫苗接种要求",
        noResults: "未找到匹配的国家。",
        emptyCatalog: "国家列表暂不可用。",
      },
    },
    hajj: {
      metaTitle: "朝觐与副朝",
      heading: "朝觐与副朝 — 卫生要求",
      description:
        "本页汇总朝觐与副朝获批疫苗的参考信息。请遵循埃及卫生部与沙特主管部门的正式决定。",
      beforeTravel: "出行前",
      documentBullets: [
        "有效护照（朝觐或副朝行程）",
        "有效国民身份证",
        "近照证件照",
      ],
      basicsTitle: "核心疫苗",
      basicsBody:
        "通常须按规定完成脑膜炎球菌等获批疫苗接种并持有旅行用接种证明。清单可能随季节调整，请以官方公告为准。",
      pricing: {
        sectionTitle: "按行程类型的参考费用",
        tripTypeLabel: "行程类型",
        tripHajj: "朝觐",
        tripUmrah: "副朝",
        guidancePrice: "参考价格",
        fluDisclaimer:
          "上述价格不含季节性流感疫苗；流感疫苗为可选项目。",
        locationsTitle: "服务地点",
        locationsBody:
          "所有授权地点均可提供服务。",
      },
    },
    citizen: {
      metaTitle: "公民服务",
      heading: "公民服务",
      description:
        "面向居民的可选疫苗与参考价格说明。实际服务与时间以授权中心及官方渠道为准。",
      vaccineTitle: "公民接种",
      vaccineBody:
        "公民：双价脑膜炎疫苗 200 埃及镑；季节性流感 260 埃及镑；乙肝疫苗按类型 — 埃及产 100、进口 200、埃及产且出境 150、进口且出境 300（均为参考价；详情可用首页查询工具）。",
      docsTitle: "所需材料",
      docsBullets: [
        "有效国民身份证",
        "有效护照 — 仅当接种或服务与国际旅行相关时请携带",
        "近照证件照",
      ],
      notesTitle: "一般提示",
      notesBody:
        "预约时间与开放服务请以授权中心或卫生部官方渠道确认为准。",
      splenectomyNote:
        "如果您曾进行脾切除手术或任何需要重新接种疫苗的手术，请随时通过 WhatsApp 咨询，或前往最近的旅客疫苗接种门诊获取完整信息。\n请勿忘记携带您的医疗报告。\n保重身体 🌻",
    },
    charter: {
      metaTitle: "利益相关方章程 — 旅客接种门诊",
      heading: "利益相关方章程",
      description:
        "旅客接种门诊章程：对公众的承诺、权利与义务，以及投诉与建议处理机制。",
      tocTitle: "本文档结构",
    },
  },
  chat: {
    title: "平台助手",
    subtitle: "开罗检疫管理处",
    greeting: "开罗检疫平台助手。可咨询服务项目、预约或办事处。",
    placeholder: "输入您的问题...",
    send: "发送",
    openAria: "打开助手",
    closeAria: "关闭助手",
    error: "暂时无法回复。请使用下方绿色 WhatsApp 按钮联系我们。",
  },
  tts: {
    read: "朗读页面内容",
    pause: "暂停朗读",
    resume: "继续朗读",
    stop: "停止朗读",
    unsupported: "此浏览器不支持文字转语音",
  },
  pwa: {
    installTitle: "安装检疫服务应用",
    installBody:
      "添加到主屏幕，更快访问疫苗接种、章程及办事处信息。",
    installButton: "安装应用",
    installDismiss: "暂不安装",
    iosHelp:
      "在 iPhone 上安装：点按 Safari 的「分享」按钮，然后选择「添加到主屏幕」。",
    installAria: "应用安装建议",
  },
};

const fr: Messages = {
  meta: {
    siteName: "Administration de la quarantaine du Caire",
    siteDescription:
      "Portail officiel des services de quarantaine et de vaccination des voyageurs au gouvernorat du Caire et dans les structures affiliees.",
  },
  skipLink: "Aller au contenu principal",
  nav: {
    subtitle: "Autorite de sante publique — Republique arabe d'Egypte",
    title: "Administration de la quarantaine du Caire",
    aria: "Navigation principale",
    home: "Accueil",
    international: "Voyageur international",
    hajjUmrah: "Hajj et Omra",
    citizen: "Services aux citoyens",
    charter: "Charte",
    myRequests: "Mes demandes",
    switchToAr: "العربية",
    switchToEn: "English",
    switchToZh: "中文",
    switchToFr: "Français",
    switchLangAria: "Changer de langue",
    bookVaccination: "Reserver un vaccin",
    bookVaccinationAria:
      "Ouvrir l'ecran de reservation de vaccination de l'Administration de la quarantaine du Caire",
    mainMenuHeading: "Menu",
    openMenuAria: "Ouvrir le menu principal",
    closeMenuAria: "Fermer le menu",
  },
  footer: {
    title: "Administration de la quarantaine du Caire",
    blurb:
      "Portail officiel d'information pour les voyageurs et les citoyens. Pour les urgences, utilisez les lignes approuvees ou visitez le centre de vaccination agree le plus proche.",
    contactTitle: "Coordonnees (exemple)",
    hotline: "Ligne directe : 16528 — 24 h/24",
    email: "E-mail : info@cqm.gov.eg",
    address: "Adresse : Le Caire, Republique arabe d'Egypte",
    copyright:
      "Tous droits reserves. Le contenu est informatif et ne remplace pas un avis medical direct.",
    creditLinkLabel: "Realise avec soin par Hakim",
  },
  hero: {
    title: "Administration de la quarantaine du Caire",
    visionLabel: "Notre vision :",
    vision:
      "Etre leader dans la prestation de services de vaccination des voyageurs avec efficacite et haute qualite, pour des voyages surs et sains.",
    missionLabel: "Notre mission :",
    mission:
      "Fournir aux voyageurs des services de vaccination et de conseil preventif de maniere sure, avec satisfaction des usagers et soutien a la sante publique.",
  },
  services: {
    heading: "Services principaux",
    intro:
      "Choisissez le parcours qui vous correspond pour consulter les exigences et les prix indicatifs des vaccins.",
    viewDetails: "Voir les details",
    internationalTitle: "Voyageur international",
    internationalDesc:
      "Vaccinations et mesures sanitaires pour les voyages a l'etranger ou le retour en Egypte.",
    hajjTitle: "Voyageur Hajj / Omra",
    hajjDesc:
      "Exigences sanitaires approuvees pour le Hajj et la Omra, avec calendriers indicatifs.",
    citizenTitle: "Citoyen",
    citizenDesc:
      "Services de vaccination et sensibilisation sanitaire pour les residents en Egypte.",
  },
  vaccineSelector: {
    heading: "Recherche de vaccins et cout indicatif",
    intro:
      "Choisissez un public, ouvrez la liste des vaccins et selectionnez un ou plusieurs vaccins pour voir les prix par ligne et le total indicatif. Le cout reel peut varier selon les politiques actualisees ou la couverture d'assurance.",
    userType: "Public",
    vaccine: "Vaccins",
    vaccinesDropdownHint: "Ouvrez la liste et cochez un ou plusieurs vaccins.",
    vaccinesSummaryNone: "Choisir des vaccins...",
    vaccinesSummaryCount: "{count} vaccins selectionnes",
    vaccinesTotal: "Total indicatif",
    vaccinesEmptySelection:
      "Aucun vaccin selectionne — ouvrez la liste ci-dessus et choisissez un ou plusieurs vaccins.",
    guidancePrice: "Cout indicatif",
    free: "Gratuit",
    currency: "EGP",
    footnote:
      "Pour la reservation et le paiement, rendez-vous dans un centre agree ou utilisez les canaux officiels lorsque les services electroniques seront connectes.",
    categories: {
      international: "Voyageur international",
      hajj: "Hajj",
      umrah: "Omra",
      citizen: "Citoyen",
    },
  },
  importantLinks: {
    heading: "Liens importants",
    pdf: "Guide de sante (PDF)",
    hajjInstructions: "Instructions Hajj et Omra",
    mosquitoPrevention:
      "Prevention des piqures de moustiques et des maladies vectorielles",
  },
  healthGuides: healthGuidesFr,
  locations: {
    heading: "Centres de vaccination agrees",
    introLead:
      "Bureaux de vaccination des voyageurs au Caire pour 2026 — services pour",
    introHighlight: "Hajj, Omra et voyageurs internationaux",
    caption:
      "Tableau des bureaux de vaccination agrees au Caire : nom du bureau, administration, gouvernorat, adresse, telephone, lien carte",
    colOffice: "Nom du bureau",
    colAdmin: "Administration",
    colGov: "Gouvernorat",
    colAddress: "Adresse",
    colPhone: "Telephone",
    colMaps: "Carte",
    mapsLink: "Google Maps",
    a11yPhone: "Appeler ce bureau par telephone",
    a11yMap: "Ouvrir l'emplacement de ce bureau sur la carte",
  },
  hajjTable: {
    heading:
      "Bureaux de vaccination des voyageurs au Caire — 2026 (liste de reference)",
    intro:
      "Les donnees sont fournies a titre indicatif ; confirmez les horaires et services via les canaux officiels du ministere de la Sante avant votre visite.",
    caption:
      "Bureaux de vaccination des voyageurs au gouvernorat du Caire avec administration, adresse, telephone, carte et type de service",
    colGov: "Gouvernorat",
    colAdmin: "Administration",
    colSerial: "No. dans le gouvernorat",
    colOffice: "Nom du bureau",
    colAddress: "Adresse du bureau",
    colHours: "Horaires",
    colPhone: "Telephone",
    colMaps: "Carte",
    colService: "Type de service",
    mapsLink: "Google Maps",
    governorate: "Le Caire",
    phoneMissing: "—",
    serviceTravelers: "Hajj, Omra et voyageurs",
    serviceUmrahOnly: "Hajj et Omra uniquement",
    a11yPhone: "Appeler ce bureau par telephone",
    a11yMap: "Ouvrir l'emplacement de ce bureau sur la carte",
    a11yPhoneUnavailable: "Aucun numero de telephone enregistre pour ce bureau",
  },
  pages: {
    international: {
      metaTitle: "Voyageur international",
      heading: "Services aux voyageurs internationaux",
      description:
        "Conseils officiels sur les vaccins et tests requis selon la destination et les regles d'entree en Egypte. Confirmez toujours les dernieres mises a jour aupres des autorites competentes avant de voyager.",
      beforeTravel: "Avant de voyager",
      bullets: [
        "Passeport valide — voyageurs internationaux",
        "Carte nationale d'identite valide",
        "Photo d'identite recente",
      ],
      destinationVaccinesIntro:
        "Pour connaitre les vaccins necessaires a votre destination, recherchez et selectionnez le pays :",
      countryRequirements: {
        searchPlaceholder:
          "Rechercher un pays (nom arabe ou anglais)…",
        selectAria: "Selectionner le pays de destination",
        listAria: "Resultats de recherche de pays",
        requirementsHeading: "Exigences de vaccination",
        noResults: "Aucun pays correspondant.",
        emptyCatalog: "La liste des pays n'est pas disponible pour le moment.",
      },
    },
    hajj: {
      metaTitle: "Hajj et Omra",
      heading: "Hajj et Omra — exigences sanitaires",
      description:
        "Cette page resume les recommandations sur les vaccinations approuvees pour le Hajj et la Omra. Suivez les decisions officielles du ministere egyptien de la Sante et des autres autorites.",
      beforeTravel: "Avant de voyager",
      documentBullets: [
        "Passeport valide pour votre voyage Hajj ou Omra",
        "Carte nationale d'identite valide",
        "Photo d'identite recente",
      ],
      basicsTitle: "Vaccinations essentielles",
      basicsBody:
        "La vaccination contre la meningite est souvent requise avec un certificat approuve pour voyager. La liste peut changer selon la saison — suivez les annonces officielles.",
      pricing: {
        sectionTitle: "Cout indicatif par type de voyage",
        tripTypeLabel: "Type de voyage",
        tripHajj: "Hajj",
        tripUmrah: "Omra",
        guidancePrice: "Cout indicatif",
        fluDisclaimer:
          "Ces prix n'incluent pas le vaccin contre la grippe saisonniere, qui est facultatif.",
        locationsTitle: "Ou les services sont fournis",
        locationsBody: "Les services sont disponibles dans tous les sites agrees.",
      },
    },
    citizen: {
      metaTitle: "Services aux citoyens",
      heading: "Services aux citoyens",
      description:
        "Informations pour les residents sur les vaccins disponibles et les prix indicatifs. Les services et rendez-vous effectifs sont fixes par les centres agrees et les canaux officiels.",
      vaccineTitle: "Vaccination pour les citoyens",
      vaccineBody:
        "Pour les citoyens : vaccin meningococcique bivalent 200 EGP ; grippe saisonniere 260 EGP ; vaccins contre l'hepatite selon le type — Egyptien 100 EGP, etranger 200 EGP, Egyptien voyageant a l'etranger 150 EGP, voyageur etranger 300 EGP (prix indicatifs ; utilisez l'outil de recherche en page d'accueil pour les details).",
      docsTitle: "Documents a apporter",
      docsBullets: [
        "Carte nationale d'identite valide",
        "Passeport valide — uniquement si la vaccination ou le service est lie a un voyage international",
        "Photo d'identite recente",
      ],
      notesTitle: "Notes generales",
      notesBody:
        "Confirmez les horaires de rendez-vous et les services disponibles aupres de votre centre agree ou des canaux officiels du ministere de la Sante.",
      splenectomyNote:
        "Si vous avez subi une splenectomie ou une intervention necessitant une revaccination, n'hesitez pas a vous renseigner via WhatsApp ou a visiter le bureau de vaccination des voyageurs le plus proche pour obtenir toutes les informations.\nN'oubliez pas d'apporter votre rapport medical.\nPrenez soin de vous",
    },
    charter: {
      metaTitle: "Charte des usagers — Bureau de vaccination des voyageurs",
      heading: "Charte des usagers",
      description:
        "Charte du bureau de vaccination des voyageurs : engagements envers le public, droits et devoirs des usagers, et traitement des plaintes et suggestions.",
      tocTitle: "Dans ce document",
    },
  },
  chat: {
    title: "Assistant du portail",
    subtitle: "Administration de la quarantaine du Caire",
    greeting:
      "Assistant du portail de quarantaine du Caire. Posez vos questions sur les services, la reservation ou les bureaux.",
    placeholder: "Saisissez votre question...",
    send: "Envoyer",
    openAria: "Ouvrir l'assistant",
    closeAria: "Fermer l'assistant",
    error:
      "Reponse indisponible pour le moment. Contactez-nous via le bouton WhatsApp vert ci-dessous.",
  },
  tts: {
    read: "Lire la page a voix haute",
    pause: "Mettre la lecture en pause",
    resume: "Reprendre la lecture",
    stop: "Arreter la lecture",
    unsupported: "La synthese vocale n'est pas prise en charge par ce navigateur",
  },
  pwa: {
    installTitle: "Installer l'application Quarantaine",
    installBody:
      "Ajoutez-la a votre ecran d'accueil pour acceder plus vite aux vaccinations, a la charte et aux informations des bureaux.",
    installButton: "Installer l'application",
    installDismiss: "Pas maintenant",
    iosHelp:
      "Pour installer sur iPhone : touchez le bouton Partager dans Safari, puis choisissez Ajouter a l'ecran d'accueil.",
    installAria: "Suggestion d'installation de l'application",
  },
};

export function getMessages(locale: string): Messages {
  if (locale === "en") return en;
  if (locale === "zh") return zh;
  if (locale === "fr") return fr;
  return ar;
}
