import type { Governorate } from "@/lib/office-requests/types";

export const DEFAULT_GOVERNORATE_ID = "cairo";

export const EGYPT_GOVERNORATES: Governorate[] = [
  { id: "cairo", labelAr: "القاهرة", sortOrder: 1, active: true },
  { id: "giza", labelAr: "الجيزة", sortOrder: 2, active: true },
  { id: "alexandria", labelAr: "الإسكندرية", sortOrder: 3, active: true },
  { id: "qalyubia", labelAr: "القليوبية", sortOrder: 4, active: true },
  { id: "port_said", labelAr: "بورسعيد", sortOrder: 5, active: true },
  { id: "suez", labelAr: "السويس", sortOrder: 6, active: true },
  { id: "luxor", labelAr: "الأقصر", sortOrder: 7, active: true },
  { id: "dakahlia", labelAr: "الدقهلية", sortOrder: 8, active: true },
  { id: "sharqia", labelAr: "الشرقية", sortOrder: 9, active: true },
  { id: "gharbia", labelAr: "الغربية", sortOrder: 10, active: true },
  { id: "monufia", labelAr: "المنوفية", sortOrder: 11, active: true },
  { id: "beheira", labelAr: "البحيرة", sortOrder: 12, active: true },
  { id: "kafr_el_sheikh", labelAr: "كفر الشيخ", sortOrder: 13, active: true },
  { id: "damietta", labelAr: "دمياط", sortOrder: 14, active: true },
  { id: "ismailia", labelAr: "الإسماعيلية", sortOrder: 15, active: true },
  { id: "fayoum", labelAr: "الفيوم", sortOrder: 16, active: true },
  { id: "beni_suef", labelAr: "بني سويف", sortOrder: 17, active: true },
  { id: "minya", labelAr: "المنيا", sortOrder: 18, active: true },
  { id: "assiut", labelAr: "أسيوط", sortOrder: 19, active: true },
  { id: "sohag", labelAr: "سوهاج", sortOrder: 20, active: true },
  { id: "qena", labelAr: "قنا", sortOrder: 21, active: true },
  { id: "aswan", labelAr: "أسوان", sortOrder: 22, active: true },
  { id: "red_sea", labelAr: "البحر الأحمر", sortOrder: 23, active: true },
  { id: "new_valley", labelAr: "الوادي الجديد", sortOrder: 24, active: true },
  { id: "matrouh", labelAr: "مطروح", sortOrder: 25, active: true },
  { id: "north_sinai", labelAr: "شمال سيناء", sortOrder: 26, active: true },
  { id: "south_sinai", labelAr: "جنوب سيناء", sortOrder: 27, active: true },
];

const GOVERNORATE_IDS = new Set(EGYPT_GOVERNORATES.map((g) => g.id));

export function normalizeGovernorateId(value: unknown): string {
  const id = String(value ?? "").trim();
  return GOVERNORATE_IDS.has(id) ? id : DEFAULT_GOVERNORATE_ID;
}

export function governorateLabelAr(id: string): string {
  return (
    EGYPT_GOVERNORATES.find((governorate) => governorate.id === id)?.labelAr ??
    id
  );
}
