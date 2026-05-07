/**
 * مصدر الحقيقة لميثاق المتعاملين — مكتب تطعيمات المسافرين.
 * نسخة لكل لغة مدعومة في الموقع؛ استخدم getTravelerVaccinationsOfficeCharter(locale).
 */

import type { Locale } from "@/lib/i18n/config";

export type TravelerVaccinationsOfficeCharter = {
  title: string;
  subtitle: string;
  introduction: {
    heading: string;
    body: string;
  };
  vision: {
    heading: string;
    text: string;
  };
  mission: {
    heading: string;
    text: string;
  };
  values: {
    heading: string;
    items: string[];
  };
  officeCommitments: {
    heading: string;
    intro: string;
    items: string[];
  };
  rights: {
    heading: string;
    intro: string;
    items: string[];
  };
  duties: {
    heading: string;
    intro: string;
    items: string[];
  };
  complaints: {
    heading: string;
    intro: string;
    channels: string[];
    responseWithin: string;
  };
  workingHours: {
    heading: string;
    dailyFromLabel: string;
    dailyToLabel: string;
    exceptLabel: string;
    from: string;
    to: string;
    except: string;
  };
  closing: string;
};

const travelerVaccinationsOfficeCharterAr: TravelerVaccinationsOfficeCharter =
  {
    title: "ميثاق المتعاملين",
    subtitle: "مكتب تطعيمات المسافرين",
    introduction: {
      heading: "أولًا: مقدمة",
      body:
        "يحرص مكتب تطعيمات المسافرين على تقديم خدمات صحية آمنة ومتميزة للمواطنين والمسافرين، بما يضمن سرعة الأداء ودقة الخدمة واحترام حقوق المتعاملين.",
    },
    vision: {
      heading: "رؤيتنا",
      text:
        "الريادة في تقديم خدمات تطعيم المسافرين بكفاءة وجودة عالية لضمان سفر آمن وصحي.",
    },
    mission: {
      heading: "رسالتنا",
      text:
        "تقديم خدمات التطعيم والاستشارات الوقائية للمسافرين بطريقة آمنة تحقق رضا المتعاملين وتدعم الصحة العامة.",
    },
    values: {
      heading: "قيمنا",
      items: [
        "الاحترام والتقدير",
        "النزاهة والشفافية",
        "سرعة تقديم الخدمة",
        "الحفاظ على الخصوصية",
        "الجودة والسلامة",
        "العمل بروح الفريق",
      ],
    },
    officeCommitments: {
      heading: "التزامات المكتب تجاه المتعاملين",
      intro: "يلتزم مكتب تطعيمات المسافرين بـ:",
      items: [
        "استقبال المتعاملين بطريقة لائقة ومحترمة.",
        "تقديم الخدمة بعدالة ودون تمييز.",
        "الالتزام بمواعيد العمل المعلنة.",
        "تقليل وقت الانتظار قدر الإمكان.",
        "توفير معلومات واضحة عن التطعيمات المطلوبة لكل دولة.",
        "الحفاظ على سرية البيانات والمعلومات الطبية.",
        "تطبيق معايير مكافحة العدوى وسلامة المرضى.",
        "توفير بيئة نظيفة وآمنة داخل المكتب.",
        "استقبال الشكاوى والمقترحات والعمل على حلها.",
        "التحسين المستمر لجودة الخدمة.",
      ],
    },
    rights: {
      heading: "حقوق المتعاملين",
      intro: "يحق للمتعامل:",
      items: [
        "الحصول على خدمة آمنة وذات جودة.",
        "معرفة التطعيمات المطلوبة وفوائدها وآثارها الجانبية المحتملة.",
        "الحصول على معاملة محترمة تحفظ الكرامة الإنسانية.",
        "تقديم شكوى أو مقترح ومتابعة الرد عليه.",
        "الحفاظ على خصوصية بياناته الشخصية والطبية.",
        "الحصول على الخدمة وفق الدور والنظام المعتمد.",
      ],
    },
    duties: {
      heading: "واجبات المتعاملين",
      intro: "نرجو من السادة المتعاملين الالتزام بـ:",
      items: [
        "إحضار المستندات المطلوبة كاملة.",
        "الالتزام بالدور وتعليمات تنظيم العمل.",
        "الإفصاح عن أي أمراض أو حساسية تجاه اللقاحات.",
        "الالتزام بالتعليمات الطبية بعد التطعيم.",
        "المحافظة على نظافة المكان والممتلكات العامة.",
        "التعامل باحترام مع العاملين والمترددين.",
      ],
    },
    complaints: {
      heading: "آلية الشكاوى والمقترحات",
      intro: "يمكن تقديم الشكاوى أو المقترحات من خلال:",
      channels: [
        "صندوق الشكاوى والمقترحات.",
        "الإدارة المباشرة بالمكتب.",
        "رقم الهاتف المخصص للشكاوى.",
      ],
      responseWithin: "يتم فحص الشكاوى والرد عليها خلال ٢٤ ساعه",
    },
    workingHours: {
      heading: "مواعيد العمل",
      dailyFromLabel: "يوميًا من:",
      dailyToLabel: "حتى:",
      exceptLabel: "ما عدا:",
      from: "..........",
      to: "..........",
      except: "..........",
    },
    closing: "معًا نحو خدمة صحية آمنة",
  };

const travelerVaccinationsOfficeCharterEn: TravelerVaccinationsOfficeCharter = {
  title: "Stakeholder charter",
  subtitle: "Travel vaccinations office",
  introduction: {
    heading: "I. Introduction",
    body:
      "The travel vaccinations office is committed to providing safe, high-quality health services to citizens and travellers, ensuring prompt performance, accurate service delivery, and respect for stakeholders’ rights.",
  },
  vision: {
    heading: "Our vision",
    text:
      "To lead in delivering traveller vaccination services efficiently and to high standards, ensuring safe and healthy travel.",
  },
  mission: {
    heading: "Our mission",
    text:
      "To provide vaccination and preventive consultation services for travellers in a safe manner that achieves stakeholder satisfaction and supports public health.",
  },
  values: {
    heading: "Our values",
    items: [
      "Respect and appreciation",
      "Integrity and transparency",
      "Prompt service delivery",
      "Protecting privacy",
      "Quality and safety",
      "Team spirit",
    ],
  },
  officeCommitments: {
    heading: "The office’s commitments to stakeholders",
    intro: "The travel vaccinations office commits to:",
    items: [
      "Receiving stakeholders in an appropriate and respectful manner.",
      "Providing services fairly and without discrimination.",
      "Adhering to published working hours.",
      "Reducing waiting times as far as possible.",
      "Providing clear information on vaccinations required for each country.",
      "Maintaining confidentiality of data and medical information.",
      "Applying infection prevention and patient safety standards.",
      "Providing a clean and safe environment within the office.",
      "Receiving complaints and suggestions and working to resolve them.",
      "Continuously improving service quality.",
    ],
  },
  rights: {
    heading: "Stakeholders’ rights",
    intro: "Every stakeholder has the right to:",
    items: [
      "Receive a safe, quality service.",
      "Know required vaccinations, their benefits, and possible side effects.",
      "Be treated with respect that upholds human dignity.",
      "Submit a complaint or suggestion and follow up on the response.",
      "Have their personal and medical data kept private.",
      "Receive service according to the approved queue and procedures.",
    ],
  },
  duties: {
    heading: "Stakeholders’ duties",
    intro: "We ask stakeholders to:",
    items: [
      "Bring all required documents in full.",
      "Follow the queue and workplace organisation instructions.",
      "Disclose any medical conditions or vaccine allergies.",
      "Follow medical instructions after vaccination.",
      "Help keep the premises and public property clean.",
      "Treat staff and other visitors with respect.",
    ],
  },
  complaints: {
    heading: "Complaints and suggestions",
    intro: "Complaints or suggestions may be submitted through:",
    channels: [
      "The complaints and suggestions box.",
      "The office management directly.",
      "The dedicated complaints telephone line.",
    ],
    responseWithin:
      "Complaints are reviewed and responded to within 24 hours.",
  },
  workingHours: {
    heading: "Working hours",
    dailyFromLabel: "Daily from:",
    dailyToLabel: "Until:",
    exceptLabel: "Except:",
    from: "..........",
    to: "..........",
    except: "..........",
  },
  closing: "Together towards safe health services",
};

const travelerVaccinationsOfficeCharterZh: TravelerVaccinationsOfficeCharter = {
  title: "利益相关方章程",
  subtitle: "旅客接种门诊",
  introduction: {
    heading: "一、前言",
    body:
      "旅客接种门诊致力于为公民与旅客提供安全、优质的卫生服务，确保高效履职、服务准确，并尊重利益相关方权利。",
  },
  vision: {
    heading: "愿景",
    text: "以高效、优质的旅客接种服务引领行业，保障出行安全与健康。",
  },
  mission: {
    heading: "使命",
    text:
      "以安全的方式为旅客提供接种与预防咨询服务，提升满意度并支持公共卫生。",
  },
  values: {
    heading: "价值观",
    items: [
      "尊重与体恤",
      "诚信与透明",
      "快速提供服务",
      "保护隐私",
      "质量与安全",
      "团队协作",
    ],
  },
  officeCommitments: {
    heading: "门诊对利益相关方的承诺",
    intro: "旅客接种门诊承诺：",
    items: [
      "以得体、尊重的方式接待来访者。",
      "公平提供服务，不搞歧视。",
      "遵守公布的营业时间。",
      "在可能范围内缩短等候时间。",
      "清晰说明各国所需的疫苗信息。",
      "保护数据与医疗信息的机密性。",
      "执行感染防控与患者安全标准。",
      "在门诊内提供清洁、安全的环境。",
      "受理投诉与建议并推动解决。",
      "持续改进服务质量。",
    ],
  },
  rights: {
    heading: "利益相关方权利",
    intro: "利益相关方有权：",
    items: [
      "获得安全、优质的服务。",
      "了解所需疫苗、益处及可能的不良反应。",
      "获得维护人格尊严的尊重对待。",
      "提出投诉或建议并跟进答复。",
      "个人与医疗信息得到隐私保护。",
      "按排队与既定流程获得服务。",
    ],
  },
  duties: {
    heading: "利益相关方义务",
    intro: "敬请利益相关方遵守：",
    items: [
      "备齐所需全部材料。",
      "遵守排队与现场秩序指引。",
      "如实告知疾病史或疫苗过敏情况。",
      "接种后遵守医嘱。",
      "维护场所整洁并爱护公共设施。",
      "尊重工作人员与其他来访者。",
    ],
  },
  complaints: {
    heading: "投诉与建议机制",
    intro: "可通过以下方式提交投诉或建议：",
    channels: [
      "投诉与建议箱。",
      "门诊现场管理。",
      "投诉专用电话。",
    ],
    responseWithin: "投诉将在24小时内受理并答复。",
  },
  workingHours: {
    heading: "营业时间",
    dailyFromLabel: "每日自：",
    dailyToLabel: "至：",
    exceptLabel: "除外：",
    from: "..........",
    to: "..........",
    except: "..........",
  },
  closing: "携手共建安全健康服务",
};

const charterByLocale: Record<Locale, TravelerVaccinationsOfficeCharter> = {
  ar: travelerVaccinationsOfficeCharterAr,
  en: travelerVaccinationsOfficeCharterEn,
  zh: travelerVaccinationsOfficeCharterZh,
};

/** @deprecated Prefer getTravelerVaccinationsOfficeCharter("ar") for clarity */
export const travelerVaccinationsOfficeCharter = travelerVaccinationsOfficeCharterAr;

export function getTravelerVaccinationsOfficeCharter(
  locale: Locale,
): TravelerVaccinationsOfficeCharter {
  return charterByLocale[locale];
}
