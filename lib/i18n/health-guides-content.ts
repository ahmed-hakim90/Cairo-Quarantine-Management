import type { HealthGuideIconId } from "@/lib/health-guides/icon-ids";

export type HealthGuidesMessages = {
  vaccination: {
    title: string;
    subtitle: string;
    sections: Array<{
      heading: string;
      items: Array<{ body: string; icon: HealthGuideIconId }>;
    }>;
    footer: { primary: string; secondary: string };
  };
  generalTips: {
    heading: string;
    intro: string;
    items: Array<{ title: string; body: string; icon: HealthGuideIconId }>;
  };
};

export const healthGuidesAr: HealthGuidesMessages = {
  vaccination: {
    title: "أهمية تلقي اللقاحات في الحج والعمرة",
    subtitle:
      "تلقي اللقاحات يحميك ويحمي الآخرين ليكون حجك أو عمرتك آمناً وصحياً.",
    sections: [
      {
        heading: "لماذا تعتبر اللقاحات مهمة في الحج والعمرة؟",
        items: [
          {
            icon: "heartPulse",
            body: "تدعم صحتك العامة، وتعزز مناعتك، وتساعد جسمك على مقاومة الأمراض.",
          },
          {
            icon: "kaabaRitual",
            body: "تضمن أداء مناسكك بصحة وأمان، وتحميك من المضاعفات الصحية التي قد تعطل رحلتك.",
          },
          {
            icon: "peopleShield",
            body: "تحمي الآخرين من خلال المساهمة في الحد من انتشار الأمراض بين الحجاج والمعتمرين.",
          },
          {
            icon: "virusShield",
            body: "تحميك من الأمراض وتقلل خطر الإصابة بالأمراض المعدية مثل الإنفلونزا والتهاب السحايا وكوفيد-19.",
          },
        ],
      },
      {
        heading: "اللقاحات الموصى بها للحجاج والمعتمرين",
        items: [
          {
            icon: "otherVaccines",
            body: "لقاحات أخرى: قد يوصي الطبيب بلقاحات إضافية وفق حالتك الصحية (مثل التهاب الكبد الفيروسي والالتهاب الرئوي).",
          },
          {
            icon: "covid",
            body: "لقاح كوفيد-19: للوقاية من مضاعفات فيروس كورونا.",
          },
          {
            icon: "lungs",
            body: "لقاح الإنفلونزا: للوقاية من مضاعفات الإنفلونزا الموسمية.",
          },
          {
            icon: "syringeVial",
            body: "لقاح التهاب السحايا الرباعي (ACYW): للوقاية من أربع سلالات من التهاب السحايا.",
          },
        ],
      },
      {
        heading: "نصائح مهمة",
        items: [
          {
            icon: "handWash",
            body: "واصل اتباع إجراءات الوقاية الأخرى مثل غسل اليدين وارتداء الكمامة عند الحاجة.",
          },
          {
            icon: "clipboard",
            body: "احتفظ بسجل تطعيماتك وأحضره معك أثناء السفر.",
          },
          {
            icon: "doctor",
            body: "استشر طبيباً أو مركزاً صحياً معتمداً لمعرفة اللقاحات المناسبة لك.",
          },
          {
            icon: "calendar",
            body: "تأكد من تلقي اللقاحات المطلوبة قبل موعد سفرك بفترة كافية.",
          },
        ],
      },
    ],
    footer: {
      primary: "لقاح اليوم ... صحة لك وللآخرين",
      secondary: "حج مبرور وذنب مغفور إن شاء الله",
    },
  },
  generalTips: {
    heading: "نصائح صحية عامة للمسافرين",
    intro:
      "إرشادات وقائية تساعدك على الحفاظ على صحتك أثناء السفر وأداء المناسك بأمان.",
    items: [
      {
        icon: "water",
        title: "اشرب الماء",
        body: "بكثرة على مدار اليوم لتجنب الجفاف، خصوصاً في الطقس الحار.",
      },
      {
        icon: "handWash",
        title: "غسل اليدين",
        body: "بالماء والصابون بانتظام، خاصة قبل الأكل وبعد استخدام دورات المياه.",
      },
      {
        icon: "mask",
        title: "ارتدِ الكمامة",
        body: "في الأماكن المزدحمة وعند الشعور بأعراض تنفسية.",
      },
      {
        icon: "syringeVial",
        title: "أخذ اللقاحات",
        body: "تأكد من أخذ اللقاحات المعتمدة مثل لقاح الحمى الشوكية والإنفلونزا الموسمية.",
      },
      {
        icon: "crowd",
        title: "تجنب الازدحام",
        body: "قدر الإمكان، وتجنب التزاحم والتدافع.",
      },
      {
        icon: "walk",
        title: "مشي معتدل",
        body: "تجنب الإرهاق والمشي المفرط، وخذ فترات راحة كافية.",
      },
      {
        icon: "sun",
        title: "حماية من الشمس",
        body: "استخدم المظلة أو القبعة، وارتدِ ملابس خفيفة وفضفاضة.",
      },
      {
        icon: "tissue",
        title: "آداب السعال والعطاس",
        body: "غطِّ فمك وأنفك بالمنديل أو الكم وتخلص من المنديل في سلة المهملات.",
      },
      {
        icon: "personalItems",
        title: "استخدم أدواتك الشخصية فقط",
        body: "مثل زجاجة الماء والأدوات الشخصية.",
      },
      {
        icon: "chronicCare",
        title: "اعتنِ بصحتك",
        body: "إذا كنت مصاباً بمرض مزمن، احرص على أخذ أدويتك بانتظام.",
      },
    ],
  },
};

export const healthGuidesEn: HealthGuidesMessages = {
  vaccination: {
    title: "Why vaccinations matter for Hajj and Umrah",
    subtitle:
      "Vaccination protects you and others so your pilgrimage can be safe and healthy.",
    sections: [
      {
        heading: "Why are vaccinations important for Hajj and Umrah?",
        items: [
          {
            icon: "heartPulse",
            body: "Supports your general health, strengthens immunity, and helps your body resist illness.",
          },
          {
            icon: "kaabaRitual",
            body: "Helps you perform rituals in good health and reduces complications that could disrupt your trip.",
          },
          {
            icon: "peopleShield",
            body: "Protects others by helping limit the spread of disease among pilgrims.",
          },
          {
            icon: "virusShield",
            body: "Reduces the risk of infectious diseases such as influenza, meningitis, and COVID-19.",
          },
        ],
      },
      {
        heading: "Recommended vaccinations for pilgrims",
        items: [
          {
            icon: "otherVaccines",
            body: "Other vaccines: a doctor may recommend additional shots based on your health (e.g. viral hepatitis, pneumonia).",
          },
          {
            icon: "covid",
            body: "COVID-19 vaccine: to help prevent serious complications from coronavirus infection.",
          },
          {
            icon: "lungs",
            body: "Influenza vaccine: for protection against seasonal flu complications.",
          },
          {
            icon: "syringeVial",
            body: "Quadrivalent meningococcal vaccine (ACYW): protects against four meningitis strains.",
          },
        ],
      },
      {
        heading: "Important tips",
        items: [
          {
            icon: "handWash",
            body: "Continue other preventive measures such as hand washing and wearing a mask when needed.",
          },
          {
            icon: "clipboard",
            body: "Keep your vaccination record and bring it when you travel.",
          },
          {
            icon: "doctor",
            body: "Consult a doctor or accredited health centre to learn which vaccines are right for you.",
          },
          {
            icon: "calendar",
            body: "Receive required vaccinations well before your travel date.",
          },
        ],
      },
    ],
    footer: {
      primary: "Today’s vaccine — health for you and others",
      secondary: "May your Hajj be accepted and your sins forgiven",
    },
  },
  generalTips: {
    heading: "General health tips for travellers",
    intro:
      "Preventive guidance to help you stay healthy during travel and perform rituals safely.",
    items: [
      {
        icon: "water",
        title: "Drink water",
        body: "Plenty throughout the day to avoid dehydration, especially in hot weather.",
      },
      {
        icon: "handWash",
        title: "Wash your hands",
        body: "With soap and water regularly, especially before eating and after using restrooms.",
      },
      {
        icon: "mask",
        title: "Wear a mask",
        body: "In crowded places and when you have respiratory symptoms.",
      },
      {
        icon: "syringeVial",
        title: "Get vaccinated",
        body: "Ensure approved vaccines such as meningitis and seasonal influenza are up to date.",
      },
      {
        icon: "crowd",
        title: "Avoid crowding",
        body: "As much as possible; avoid pushing and dense gatherings.",
      },
      {
        icon: "walk",
        title: "Walk moderately",
        body: "Avoid exhaustion and excessive walking; take adequate rest breaks.",
      },
      {
        icon: "sun",
        title: "Sun protection",
        body: "Use an umbrella or hat and wear light, loose clothing.",
      },
      {
        icon: "tissue",
        title: "Cough & sneeze etiquette",
        body: "Cover your mouth and nose with a tissue or sleeve; dispose of tissues properly.",
      },
      {
        icon: "personalItems",
        title: "Use personal items only",
        body: "Such as your own water bottle and personal toiletries.",
      },
      {
        icon: "chronicCare",
        title: "Manage chronic conditions",
        body: "If you have a chronic illness, take your medications regularly.",
      },
    ],
  },
};

export const healthGuidesZh: HealthGuidesMessages = {
  vaccination: {
    title: "朝觐与副朝接种的重要性",
    subtitle: "接种疫苗保护您和他人，使朝觐或副朝更安全、更健康。",
    sections: [
      {
        heading: "为何朝觐与副朝接种很重要？",
        items: [
          {
            icon: "heartPulse",
            body: "有助于整体健康、增强免疫力并提高身体抗病能力。",
          },
          {
            icon: "kaabaRitual",
            body: "有助于在健康状态下完成宗教功课，降低可能影响行程的健康并发症风险。",
          },
          {
            icon: "peopleShield",
            body: "通过减少疾病在朝觐者之间的传播来保护他人。",
          },
          {
            icon: "virusShield",
            body: "降低流感、脑膜炎、新冠肺炎等传染病感染风险。",
          },
        ],
      },
      {
        heading: "建议朝觐者接种的疫苗",
        items: [
          {
            icon: "otherVaccines",
            body: "其他疫苗：医生可能根据您的健康状况建议额外接种（如病毒性肝炎、肺炎等）。",
          },
          {
            icon: "covid",
            body: "新冠疫苗：有助于预防新冠病毒感染的重症并发症。",
          },
          {
            icon: "lungs",
            body: "流感疫苗：预防季节性流感的严重并发症。",
          },
          {
            icon: "syringeVial",
            body: "四价脑膜炎球菌疫苗（ACYW）：预防四种脑膜炎球菌血清型。",
          },
        ],
      },
      {
        heading: "重要提示",
        items: [
          {
            icon: "handWash",
            body: "继续采取其他预防措施，如勤洗手，必要时佩戴口罩。",
          },
          {
            icon: "clipboard",
            body: "妥善保存接种记录，出行时随身携带。",
          },
          {
            icon: "doctor",
            body: "咨询医生或授权卫生机构，了解适合您的疫苗。",
          },
          {
            icon: "calendar",
            body: "请在出行日期前足够早的时间完成所需接种。",
          },
        ],
      },
    ],
    footer: {
      primary: "今日接种，护己护人",
      secondary: "愿您的朝觐被接受，罪过得以宽恕",
    },
  },
  generalTips: {
    heading: "旅客一般健康提示",
    intro: "预防性指导，帮助您在旅途中保持健康并安全完成宗教功课。",
    items: [
      {
        icon: "water",
        title: "多喝水",
        body: "全天足量饮水以防脱水，炎热天气尤需注意。",
      },
      {
        icon: "handWash",
        title: "勤洗手",
        body: "用肥皂和清水定期清洗，尤其在进食前和使用卫生间后。",
      },
      {
        icon: "mask",
        title: "佩戴口罩",
        body: "在拥挤场所或有呼吸道症状时佩戴。",
      },
      {
        icon: "syringeVial",
        title: "接种疫苗",
        body: "确保完成脑膜炎、季节性流感等获批疫苗接种。",
      },
      {
        icon: "crowd",
        title: "避免拥挤",
        body: "尽量避开人群密集、推挤的场所。",
      },
      {
        icon: "walk",
        title: "适度步行",
        body: "避免过度疲劳和过量行走，保证充足休息。",
      },
      {
        icon: "sun",
        title: "防晒",
        body: "使用遮阳伞或帽子，穿着轻薄宽松的衣物。",
      },
      {
        icon: "tissue",
        title: "咳嗽礼仪",
        body: "用纸巾或衣袖遮住口鼻，将纸巾投入垃圾桶。",
      },
      {
        icon: "personalItems",
        title: "仅使用个人物品",
        body: "如水杯和个人洗漱用品等。",
      },
      {
        icon: "chronicCare",
        title: "管理慢性病",
        body: "如有慢性疾病，请按时服药。",
      },
    ],
  },
};

export const healthGuidesFr: HealthGuidesMessages = {
  vaccination: {
    title: "Pourquoi les vaccinations comptent pour le Hajj et la Omra",
    subtitle:
      "La vaccination vous protege, ainsi que les autres, pour un pelerinage plus sur et plus sain.",
    sections: [
      {
        heading: "Pourquoi les vaccins sont-ils importants pour le Hajj et la Omra ?",
        items: [
          {
            icon: "heartPulse",
            body: "Ils soutiennent votre sante generale, renforcent l'immunite et aident votre corps a resister aux maladies.",
          },
          {
            icon: "kaabaRitual",
            body: "Ils vous aident a accomplir les rites en bonne sante et limitent les complications qui pourraient perturber votre voyage.",
          },
          {
            icon: "peopleShield",
            body: "Ils protegent les autres en contribuant a limiter la propagation des maladies entre pelerins.",
          },
          {
            icon: "virusShield",
            body: "Ils reduisent le risque de maladies infectieuses comme la grippe, la meningite et la COVID-19.",
          },
        ],
      },
      {
        heading: "Vaccins recommandes pour les pelerins",
        items: [
          {
            icon: "otherVaccines",
            body: "Autres vaccins : un medecin peut recommander des doses supplementaires selon votre etat de sante (hepatite virale, pneumonie, etc.).",
          },
          {
            icon: "covid",
            body: "Vaccin COVID-19 : pour aider a prevenir les complications graves liees au coronavirus.",
          },
          {
            icon: "lungs",
            body: "Vaccin contre la grippe : pour se proteger des complications de la grippe saisonniere.",
          },
          {
            icon: "syringeVial",
            body: "Vaccin meningococcique quadrivalent (ACYW) : protege contre quatre souches de meningite.",
          },
        ],
      },
      {
        heading: "Conseils importants",
        items: [
          {
            icon: "handWash",
            body: "Continuez les mesures preventives comme le lavage des mains et le port du masque si necessaire.",
          },
          {
            icon: "clipboard",
            body: "Conservez votre carnet de vaccination et emportez-le pendant le voyage.",
          },
          {
            icon: "doctor",
            body: "Consultez un medecin ou un centre de sante agree pour connaitre les vaccins adaptes a votre situation.",
          },
          {
            icon: "calendar",
            body: "Recevez les vaccins requis suffisamment tot avant votre date de voyage.",
          },
        ],
      },
    ],
    footer: {
      primary: "Le vaccin d'aujourd'hui, une sante pour vous et les autres",
      secondary: "Que votre Hajj soit accepte",
    },
  },
  generalTips: {
    heading: "Conseils generaux de sante pour les voyageurs",
    intro:
      "Des recommandations preventives pour rester en bonne sante pendant le voyage et accomplir les rites en securite.",
    items: [
      {
        icon: "water",
        title: "Buvez de l'eau",
        body: "En quantite suffisante toute la journee pour eviter la deshydratation, surtout par temps chaud.",
      },
      {
        icon: "handWash",
        title: "Lavez-vous les mains",
        body: "Regulierement avec de l'eau et du savon, surtout avant de manger et apres les toilettes.",
      },
      {
        icon: "mask",
        title: "Portez un masque",
        body: "Dans les lieux bondes et en cas de symptomes respiratoires.",
      },
      {
        icon: "syringeVial",
        title: "Faites vos vaccins",
        body: "Verifiez que les vaccins approuves, comme la meningite et la grippe saisonniere, sont a jour.",
      },
      {
        icon: "crowd",
        title: "Evitez la foule",
        body: "Autant que possible, et evitez les bousculades et les attroupements denses.",
      },
      {
        icon: "walk",
        title: "Marchez moderement",
        body: "Evitez l'epuisement et les marches excessives ; prevoyez des pauses suffisantes.",
      },
      {
        icon: "sun",
        title: "Protegez-vous du soleil",
        body: "Utilisez un parapluie ou un chapeau et portez des vetements legers et amples.",
      },
      {
        icon: "tissue",
        title: "Toux et eternuements",
        body: "Couvrez votre bouche et votre nez avec un mouchoir ou votre manche, puis jetez les mouchoirs correctement.",
      },
      {
        icon: "personalItems",
        title: "Utilisez vos effets personnels",
        body: "Comme votre propre bouteille d'eau et vos articles d'hygiene.",
      },
      {
        icon: "chronicCare",
        title: "Suivez vos maladies chroniques",
        body: "Si vous avez une maladie chronique, prenez vos medicaments regulierement.",
      },
    ],
  },
};
