import type { Locale } from "@/lib/i18n/config";
import type {
  OfficeRequestStatus,
  OfficeRequestType,
  TravelerCategory,
} from "@/lib/office-requests/types";

export const publicRequestTypeLabels = {
  ar: {
    booking: "حجز تطعيم",
    complaint: "شكوى",
    proposal: "مقترح",
  },
  en: {
    booking: "Vaccination booking",
    complaint: "Complaint",
    proposal: "Suggestion",
  },
  zh: {
    booking: "疫苗预约",
    complaint: "投诉",
    proposal: "建议",
  },
  fr: {
    booking: "Reservation de vaccination",
    complaint: "Plainte",
    proposal: "Suggestion",
  },
} satisfies Record<Locale, Record<OfficeRequestType, string>>;

export const publicTravelerCategoryLabels = {
  ar: {
    international: "مسافر دولي",
    hajj_umrah: "حج / عمرة",
    citizen: "مواطن",
  },
  en: {
    international: "International traveller",
    hajj_umrah: "Hajj / Umrah",
    citizen: "Citizen",
  },
  zh: {
    international: "国际旅客",
    hajj_umrah: "朝觐 / 副朝",
    citizen: "公民",
  },
  fr: {
    international: "Voyageur international",
    hajj_umrah: "Hajj / Omra",
    citizen: "Citoyen",
  },
} satisfies Record<Locale, Record<TravelerCategory, string>>;

export const publicRequestStatusLabels = {
  ar: {
    new: "جديد",
    in_progress: "قيد المتابعة",
    contacted: "تم التواصل",
    completed: "مكتمل",
    cancelled: "ملغي",
  },
  en: {
    new: "New",
    in_progress: "In progress",
    contacted: "Contacted",
    completed: "Completed",
    cancelled: "Cancelled",
  },
  zh: {
    new: "新申请",
    in_progress: "处理中",
    contacted: "已联系",
    completed: "已完成",
    cancelled: "已取消",
  },
  fr: {
    new: "Nouveau",
    in_progress: "En cours",
    contacted: "Contacte",
    completed: "Termine",
    cancelled: "Annule",
  },
} satisfies Record<Locale, Record<OfficeRequestStatus, string>>;
