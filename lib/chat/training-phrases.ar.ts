import type { ChatIntent } from "@/lib/chat/intent";

export type TrainingPhrase = {
  phrase: string;
  expectedIntent: ChatIntent;
};

/** Golden phrases for intent regression tests (Egyptian Arabic + MSA). */
export const TRAINING_PHRASES_AR: TrainingPhrase[] = [
  { phrase: "كيف احجز موعد", expectedIntent: "booking" },
  { phrase: "عايز احجز", expectedIntent: "booking" },
  { phrase: "احجزلي موعد تطعيم", expectedIntent: "booking" },
  { phrase: "بكام اللقاح", expectedIntent: "price" },
  { phrase: "كام الثمن", expectedIntent: "price" },
  { phrase: "تكلفة التطعيم", expectedIntent: "price" },
  { phrase: "فين اقرب مكتب", expectedIntent: "office" },
  { phrase: "عنوان المكتب", expectedIntent: "office" },
  { phrase: "مكتب في حلوان", expectedIntent: "office" },
  { phrase: "حلوان", expectedIntent: "office" },
  { phrase: "مواعيد مكتب المحكمة", expectedIntent: "office_hours" },
  { phrase: "امتى مفتوح مكتب النزهة", expectedIntent: "office_hours" },
  { phrase: "ايه الخدمات", expectedIntent: "services" },
  { phrase: "خدمات المنصة", expectedIntent: "services" },
  { phrase: "مسافر لتركيا ايه اللقاحات", expectedIntent: "destination_vaccines" },
  { phrase: "تطعيمات السفر لالسعودية", expectedIntent: "destination_vaccines" },
  { phrase: "تطعيم الحج", expectedIntent: "hajj_umrah" },
  { phrase: "عمرة", expectedIntent: "hajj_umrah" },
  { phrase: "ازاي اسجل حضور", expectedIntent: "checkin_info" },
  { phrase: "تسجيل حضور في المكتب", expectedIntent: "checkin_info" },
  { phrase: "عايز اقدم شكوى", expectedIntent: "complaint_info" },
  { phrase: "تقديم شكوى", expectedIntent: "complaint_info" },
  { phrase: "مسافر دولي ايه المطلوب", expectedIntent: "international_info" },
  { phrase: "متطلبات المسافر الدولي", expectedIntent: "international_info" },
];
