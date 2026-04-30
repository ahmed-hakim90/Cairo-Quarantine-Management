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
    switchToAr: string;
    switchToEn: string;
    switchLangAria: string;
  };
  footer: {
    title: string;
    blurb: string;
    contactTitle: string;
    hotline: string;
    email: string;
    address: string;
    copyright: string;
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
  };
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
    colPhone: string;
    colMaps: string;
    colService: string;
    mapsLink: string;
    governorate: string;
    phoneMissing: string;
    serviceTravelers: string;
    serviceUmrahOnly: string;
  };
  pages: {
    international: {
      metaTitle: string;
      heading: string;
      description: string;
      beforeTravel: string;
      bullets: [string, string, string];
    };
    hajj: {
      metaTitle: string;
      heading: string;
      description: string;
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
      instructionsTitle: string;
      instructions: [string, string, string];
      umrahPathTitle: string;
      umrahPathBody: string;
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
    };
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
    subtitle: "هيئة صحة عامة — جمهورية مصر العربية",
    title: "إدارة الحجر الصحي بالقاهرة",
    aria: "التنقل الرئيسي",
    home: "الرئيسية",
    international: "مسافر دولي",
    hajjUmrah: "الحج والعمرة",
    citizen: "خدمات المواطنين",
    switchToAr: "العربية",
    switchToEn: "English",
    switchLangAria: "تغيير اللغة",
  },
  footer: {
    title: "إدارة الحجر الصحي بالقاهرة",
    blurb:
      "بوابة معلومات رسمية للمسافرين والمواطنين. للاستفسارات الطارئة يرجى التواصل عبر الخطوط المعتمدة أو زيارة أقرب مركز تطعيم معتمد.",
    contactTitle: "معلومات الاتصال (عرض توضيحي)",
    hotline: "الخط الساخن: ١٦٥٢٨ — على مدار الساعة",
    email: "البريد الإلكتروني: info@cqm.gov.eg",
    address: "العنوان: القاهرة، جمهورية مصر العربية",
    copyright:
      "جميع الحقوق محفوظة. المحتوى المعروض للتوعية ولا يغني عن التوجيه الطبي المباشر.",
  },
  hero: {
    title: "إدارة الحجر الصحي بالقاهرة",
    visionLabel: "الرؤية:",
    vision:
      "تعزيز صحة المجتمع وسلامة المسافرين عبر خدمات حجر صحي موثوقة وشفافة ومتاحة للجميع.",
    missionLabel: "الرسالة:",
    mission:
      "تقديم إرشادات رسمية، وتنسيق التطعيمات والفحوصات المطلوبة، ودعم التكامل مع الجهات المعنية بما يضمن الامتثال للمعايير الصحية الوطنية والدولية.",
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
      "اختر الفئة ثم نوع اللقاح لعرض السعر التوجيهي. قد تختلف التكلفة الفعلية بحسب السياسات المحدثة أو التغطية التأمينية.",
    userType: "نوع المستخدم",
    vaccine: "اللقاح",
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
    pdf: "تحميل الدليل الصحي (PDF)",
    hajjInstructions: "تعليمات الحج والعمرة",
  },
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
    colPhone: "رقم التليفون",
    colMaps: "الموقع",
    colService: "نوع الخدمة",
    mapsLink: "خرائط Google",
    governorate: "القاهرة",
    phoneMissing: "——",
    serviceTravelers: "حجاج ومعتمرين ومسافرين",
    serviceUmrahOnly: "حجاج ومعتمرين فقط",
  },
  pages: {
    international: {
      metaTitle: "مسافر دولي",
      heading: "خدمات المسافر الدولي",
      description:
        "إرشادات رسمية حول التطعيمات والفحوصات المطلوبة وفق وجهة السفر وحالة الوصول إلى جمهورية مصر العربية. يرجى التحقق من آخر التحديثات الصادرة عن الجهات المختصة قبل السفر.",
      beforeTravel: "قبل السفر",
      bullets: [
        "احرص على إحضار جواز السفر ساري المفعول وأي مستندات صحية مطلوبة.",
        "راجع متطلبات وجهتك بخصوص التطعيمات الإلزامية أو الموصى بها.",
        "احجز موعداً مسبقاً في مركز تطعيم معتمد عند الحاجة.",
      ],
    },
    hajj: {
      metaTitle: "الحج والعمرة",
      heading: "الحج والعمرة — المتطلبات الصحية",
      description:
        "تنظم هذه الصفحة المعلومات التوجيهية الخاصة بالتطعيمات المعتمدة للحج والعمرة. يجب الالتزام بالقرارات الرسمية الصادرة عن وزارة الصحة والجهات السعودية المختصة.",
      basicsTitle: "التطعيمات الأساسية",
      basicsBody:
        "يُطلب عادةً استكمال تطعيم التهاب السحايا وفق اللقاحات المعتمدة، مع الاحتفاظ بشهادة معتمدة تُعرض عند السفر. قد تُحدَّث القائمة وفق الموسم؛ يُرجى متابعة الإعلانات الرسمية.",
      instructionsTitle: "تعليمات الحج والعمرة",
      instructions: [
        "احضر بطاقة الهوية أو جواز السفر وأصل شهادات التطعيم المعتمدة، وتأكد من مطابقة البيانات الشخصية لجميع الوثائق.",
        "في حال ظهور أعراض تنفسية حادة، يُفضَّل تأجيل السفر والتواصل مع خط الإرشاد الطبي قبل الحضور إلى المركز.",
        "احتفظ بنسخة إلكترونية من الوثائق الصحية وتجنّب ازدحام غير منظم داخل المراكز؛ إجراءات التنظيم تُعلَن رسمياً عبر القنوات المعتمدة.",
      ],
      pricing: {
        sectionTitle: "التكلفة التوجيهية حسب نوع الرحلة",
        tripTypeLabel: "نوع الرحلة",
        tripHajj: "حج",
        tripUmrah: "عمرة",
        guidancePrice: "التكلفة التوجيهية",
        fluDisclaimer:
          "هذه الاسعار لا تشمل سعر لقاح الانفلونزا الموسمية حيث أنه اختياري",
        locationsTitle: "أماكن تقديم الخدمة",
        locationsBody:
          "الخدمة متاحة في جميع الأماكن المعتمدة (مرجع: شيت إكسل أماكن تطعيم الحجاج والمعتمرين).",
      },
      umrahPathTitle: "لقاحات إضافية",
      umrahPathBody:
        "لمعرفة سعر لقاح الإنفلونزا الموسمية أو التفاصيل التوجيهية، استخدم أداة الاستعلام أدناه بعد اختيار «حج» أو «عمرة» حسب رحلتك.",
    },
    citizen: {
      metaTitle: "خدمات المواطنين",
      heading: "خدمات المواطنين",
      description:
        "معلومات موجهة للمواطنين داخل الجمهورية حول التطعيمات المتاحة والأسعار التوجيهية. الخدمات الفعلية والمواعيد تُحدَّد عبر المراكز المعتمدة والقنوات الرسمية.",
      vaccineTitle: "التطعيم المتاح للمواطنين",
      vaccineBody:
        "يتم تطعيم المواطنين بطعم السحائي الثنائي سعر 200 ج.",
      docsTitle: "الوثائق المطلوبة",
      docsBullets: [
        "بطاقة الرقم القومي سارية.",
        "بطاقة التأمين الصحي عند الانطباق.",
        "أي تقارير طبية ذات صلة بالحالة الصحية.",
      ],
      notesTitle: "ملاحظات عامة",
      notesBody:
        "يرجى مراجعة المركز المعتمد أو القنوات الرسمية لوزارة الصحة لتأكيد المواعيد والخدمات الفعلية.",
    },
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
    switchToAr: "العربية",
    switchToEn: "English",
    switchLangAria: "Change language",
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
  },
  hero: {
    title: "Cairo Quarantine Administration",
    visionLabel: "Vision:",
    vision:
      "Protect community health and traveller safety through reliable, transparent quarantine services that are accessible to everyone.",
    missionLabel: "Mission:",
    mission:
      "Provide official guidance, coordinate required vaccinations and screenings, and support cooperation with stakeholders to meet national and international health standards.",
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
      "Pick an audience and vaccine to see the indicative price. Actual cost may vary with updated policies or insurance coverage.",
    userType: "Audience",
    vaccine: "Vaccine",
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
    pdf: "Download health guide (PDF)",
    hajjInstructions: "Hajj & Umrah instructions",
  },
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
    colPhone: "Phone",
    colMaps: "Map",
    colService: "Service type",
    mapsLink: "Google Maps",
    governorate: "Cairo",
    phoneMissing: "—",
    serviceTravelers: "Hajj, Umrah & travellers",
    serviceUmrahOnly: "Hajj & Umrah only",
  },
  pages: {
    international: {
      metaTitle: "International traveller",
      heading: "International traveller services",
      description:
        "Official guidance on vaccinations and tests required by destination and entry rules for Egypt. Always confirm the latest updates from competent authorities before travel.",
      beforeTravel: "Before you travel",
      bullets: [
        "Bring a valid passport and any required health documents.",
        "Check your destination’s mandatory or recommended vaccinations.",
        "Book ahead at an authorised vaccination centre when needed.",
      ],
    },
    hajj: {
      metaTitle: "Hajj & Umrah",
      heading: "Hajj & Umrah — health requirements",
      description:
        "This page summarises guidance on approved vaccinations for Hajj and Umrah. Follow official decisions from Egypt’s Ministry of Health and Saudi authorities.",
      basicsTitle: "Core vaccinations",
      basicsBody:
        "Meningitis vaccination is commonly required with an approved certificate for travel. The list may change by season — follow official announcements.",
      instructionsTitle: "Hajj & Umrah instructions",
      instructions: [
        "Bring ID or passport and original approved vaccination certificates; personal details must match all documents.",
        "If you have severe respiratory symptoms, postpone travel and contact medical guidance before visiting a centre.",
        "Keep electronic copies of health documents and avoid unmanaged crowding; centre organisation is announced through official channels.",
      ],
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
          "Services are available at all authorised locations (reference: Excel sheet — Hajj and Umrah vaccination sites).",
      },
      umrahPathTitle: "Additional vaccines",
      umrahPathBody:
        "For the indicative price of seasonal influenza or other details, use the lookup tool below and choose “Hajj” or “Umrah” to match your trip.",
    },
    citizen: {
      metaTitle: "Citizen services",
      heading: "Citizen services",
      description:
        "Information for residents on available vaccines and indicative prices. Actual services and appointments are set by authorised centres and official channels.",
      vaccineTitle: "Vaccination for citizens",
      vaccineBody:
        "Citizens receive the bivalent meningococcal vaccine at an indicative price of 200 EGP.",
      docsTitle: "Documents to bring",
      docsBullets: [
        "Valid national ID card.",
        "Health insurance card where applicable.",
        "Any medical reports relevant to your condition.",
      ],
      notesTitle: "General notes",
      notesBody:
        "Confirm appointment times and available services with your authorised centre or official Ministry of Health channels.",
    },
  },
};

export function getMessages(locale: string): Messages {
  return locale === "en" ? en : ar;
}
