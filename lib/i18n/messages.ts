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
    switchToZh: string;
    switchLangAria: string;
    bookVaccination: string;
    bookVaccinationAria: string;
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
    a11yPhone: string;
    a11yMap: string;
  };
  travelerStats: {
    heading: string;
    intro: string;
    caption: string;
    pendingValue: string;
    viewDetails: string;
    footnote: string;
    periodLabel: string;
    sourceLink: string;
    sourcePending: string;
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
      docsBullets: string[];
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
    subtitle: " ",
    title: "إدارة الحجر الصحي بالقاهرة",
    aria: "التنقل الرئيسي",
    home: "الرئيسية",
    international: "مسافر دولي",
    hajjUmrah: "الحج والعمرة",
    citizen: "خدمات المواطنين",
    switchToAr: "العربية",
    switchToEn: "English",
    switchToZh: "中文",
    switchLangAria: "تغيير اللغة",
    bookVaccination: "حجز تطعيم",
    bookVaccinationAria: "فتح نموذج حجز التطعيم في نافذة جديدة",
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
    creditLinkLabel: "صنع ب ❣️ HAKIMO",
  },
  hero: {
    title: "إدارة الحجر الصحي بالقاهرة",
    visionLabel: "الرؤية:",
    vision:
      "لضمان رحلة آمنة خالية من المخاطر الصحية ",
    missionLabel: "الرسالة:",
    mission:
      "نلتزم بتقديم خدمات تطعيم  متكاملة للمسافرين (حجاج، معتمرين، ومسافرين لجميع دول العالم) مع توفير معلومات دقيقة وحديثة عن الاشتراطات الصحية الدولية، بما يضمن حمايتكم من الأمراض المعدية",
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
    a11yPhone: "اتصال هاتفي بهذا المكتب",
    a11yMap: "فتح موقع المكتب على الخريطة",
  },
  travelerStats: {
    heading: "أعداد المسافرين والفئات المرتبطة بخدمات الحجر الصحي",
    intro:
      "عرض توجيهي يقابل مسارات الخدمات الثلاثة على البوابة. تُحدَّث الأرقام عند توفر بيانات منشورة رسميًا من الجهات المختصة.",
    caption:
      "بطاقات تعرض العدد المرجعي أو حالة التحديث لكل فئة مع رابط للتفاصيل",
    pendingValue: "قيد التحديث",
    viewDetails: "عرض الصفحة",
    footnote:
      "الأرقام المعروضة لا تغني عن النشر الرسمي؛ يُرجى اعتماد المصدر المحدّد من الجهة صاحبة الشأن.",
    periodLabel: "المرجع:",
    sourceLink: "المصدر الرسمي",
    sourcePending: "سيُذكر رابط المصدر عند اعتماد الرقم من جهة رسمية.",
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
        "احرص على إحضار البطاقة الشخصية (الرقم القومي) سارية المفعول فقط.",
        "راجع متطلبات وجهتك بخصوص التطعيمات الإلزامية أو الموصى بها.",
        "احجز موعداً مسبقاً في مركز تطعيم معتمد عند الحاجة (مكاتب التحصين الدولية).",
      ],
    },
    hajj: {
      metaTitle: "الحج والعمرة",
      heading: "الحج والعمرة — المتطلبات الصحية",
      description:
        "تنظم هذه الصفحة المعلومات التوجيهية الخاصة بالتطعيمات المعتمدة للحج والعمرة. يجب الالتزام بالقرارات الرسمية الصادرة عن وزارة الصحة والجهات  المختصة.",
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
          "حيث ان لقاح الانفلونزا لقاح موسمي ويوصى به حال توفره",
        locationsTitle: "أماكن تقديم الخدمة",
        locationsBody:
          "الخدمة متاحة في جميع الأماكن المعتمدة.",
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
        "للمواطنين: ",
      docsTitle: "الوثائق المطلوبة",
      docsBullets: ["البطاقة الشخصية (الرقم القومي) سارية ."],
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
    switchToZh: "中文",
    switchLangAria: "Change language",
    bookVaccination: "Book vaccination",
    bookVaccinationAria: "Open vaccination booking form in a new tab",
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
    a11yPhone: "Call this office by phone",
    a11yMap: "Open this office location on the map",
  },
  travelerStats: {
    heading: "Traveller volumes aligned with portal service paths",
    intro:
      "Indicative figures matching the three service routes on this portal. Numbers are updated when competent authorities publish official statistics.",
    caption:
      "Cards showing reference counts or update status per category with detail links",
    pendingValue: "Pending update",
    viewDetails: "Open page",
    footnote:
      "Displayed figures do not replace official publications; defer to the cited source from the responsible authority.",
    periodLabel: "Reference:",
    sourceLink: "Official source",
    sourcePending:
      "A source link will appear once figures are adopted from an official body.",
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
        "Bring a valid national ID card only.",
        "Check your destination’s mandatory or recommended vaccinations.",
        "Book ahead at an authorised vaccination centre when needed.",
      ],
    },
    hajj: {
      metaTitle: "Hajj & Umrah",
      heading: "Hajj & Umrah — health requirements",
      description:
        "This page summarises guidance on approved vaccinations for Hajj and Umrah. Follow official decisions from Egypt’s Ministry of Health and other authorities.",
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
          "Services are available at all authorised locations .",
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
        "For citizens: bivalent meningococcal vaccine 200 EGP; seasonal influenza 260 EGP; hepatitis vaccines by type — Egyptian 100 EGP, foreign 200 EGP, Egyptian travelling abroad 150 EGP, foreign traveller 300 EGP (indicative prices; use the home-page lookup for details).",
      docsTitle: "Documents to bring",
      docsBullets: ["Valid national ID card only."],
      notesTitle: "General notes",
      notesBody:
        "Confirm appointment times and available services with your authorised centre or official Ministry of Health channels.",
    },
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
    switchToAr: "العربية",
    switchToEn: "English",
    switchToZh: "中文",
    switchLangAria: "切换语言",
    bookVaccination: "预约接种",
    bookVaccinationAria: "在新标签页打开疫苗接种预约表单",
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
    visionLabel: "愿景：",
    vision:
      "通过可靠、透明、人人可及的检疫服务，保障公众健康与旅客安全。",
    missionLabel: "使命：",
    mission:
      "提供官方指引，协调所需疫苗与筛查，并支持与各方的协作，以符合国内与国际卫生标准。",
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
    pdf: "下载健康指南（PDF）",
    hajjInstructions: "朝觐与副朝须知",
  },
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
  travelerStats: {
    heading: "与检疫服务路径对应的旅客规模（参考）",
    intro:
      "与本门户三类服务路径相对应的参考数据。主管部门正式发布统计数据后将予以更新。",
    caption: "各类参考人数或更新状态及详情链接",
    pendingValue: "待更新",
    viewDetails: "打开页面",
    footnote:
      "所示数字不能替代正式发布；请以主管部门公布的来源为准。",
    periodLabel: "参考：",
    sourceLink: "官方来源",
    sourcePending: "待主管部门采纳数字后将附上来源链接。",
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
        "仅需携带有效的国民身份证。",
        "查询目的地对强制或建议接种的要求。",
        "如需请提前预约授权接种中心。",
      ],
    },
    hajj: {
      metaTitle: "朝觐与副朝",
      heading: "朝觐与副朝 — 卫生要求",
      description:
        "本页汇总朝觐与副朝获批疫苗的参考信息。请遵循埃及卫生部与沙特主管部门的正式决定。",
      basicsTitle: "核心疫苗",
      basicsBody:
        "通常须按规定完成脑膜炎球菌等获批疫苗接种并持有旅行用接种证明。清单可能随季节调整，请以官方公告为准。",
      instructionsTitle: "朝觐与副朝须知",
      instructions: [
        "携带身份证件或护照及原件接种证明；个人信息须与各文件一致。",
        "若有严重呼吸道症状，建议暂缓出行并于到访中心前咨询医疗指引。",
        "保存健康文件电子版，避免无序聚集；现场安排以官方渠道发布为准。",
      ],
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
      umrahPathTitle: "其他疫苗",
      umrahPathBody:
        "如需季节性流感等参考价格，请在下方工具中选择与行程相符的「朝觐」或「副朝」。",
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
      docsBullets: ["仅需携带有效的国民身份证。"],
      notesTitle: "一般提示",
      notesBody:
        "预约时间与开放服务请以授权中心或卫生部官方渠道确认为准。",
    },
  },
};

export function getMessages(locale: string): Messages {
  if (locale === "en") return en;
  if (locale === "zh") return zh;
  return ar;
}
