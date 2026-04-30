/**
 * Vaccine catalog grouped by audience.
 * Replace or sync from API / imported JSON (e.g. Excel → JSON) without changing UI logic.
 */
export type UserCategory = "international" | "hajj" | "umrah" | "citizen";

export type VaccineRecord = {
  id: string;
  nameAr: string;
  nameEn: string;
  /** Price in EGP; ignored when free is true */
  priceEgp: number | null;
  free: boolean;
};

export const VACCINES_BY_CATEGORY: Record<UserCategory, VaccineRecord[]> = {
  international: [
    {
      id: "meningitis-quad-travel",
      nameAr: "السحائي الرباعي للمسافرين للخارج",
      nameEn: "Quadrivalent meningococcal (international travellers)",
      priceEgp: 800,
      free: false,
    },
    {
      id: "yellow-fever",
      nameAr: "الحمى الصفراء",
      nameEn: "Yellow fever",
      priceEgp: 1250,
      free: false,
    },
    {
      id: "cholera",
      nameAr: "الكوليرا",
      nameEn: "Cholera",
      priceEgp: 360,
      free: false,
    },
    {
      id: "polio",
      nameAr: "شلل الأطفال",
      nameEn: "Polio",
      priceEgp: 80,
      free: false,
    },
    {
      id: "seasonal-flu",
      nameAr: "الإنفلونزا الموسمية",
      nameEn: "Seasonal influenza",
      priceEgp: 260,
      free: false,
    },
    {
      id: "malaria",
      nameAr: "الملاريا",
      nameEn: "Malaria",
      priceEgp: null,
      free: true,
    },
  ],
  hajj: [
    {
      id: "meningitis-quad-hajj",
      nameAr: "السحائي الرباعي للحج",
      nameEn: "Quadrivalent meningococcal (Hajj)",
      priceEgp: 670,
      free: false,
    },
    {
      id: "flu-seasonal-hajj",
      nameAr: "الإنفلونزا الموسمية",
      nameEn: "Seasonal influenza",
      priceEgp: 260,
      free: false,
    },
  ],
  umrah: [
    {
      id: "meningitis-bivalent-umrah",
      nameAr: "السحائي الثنائي",
      nameEn: "Bivalent meningococcal",
      priceEgp: 200,
      free: false,
    },
    {
      id: "flu-seasonal-umrah",
      nameAr: "الإنفلونزا الموسمية",
      nameEn: "Seasonal influenza",
      priceEgp: 260,
      free: false,
    },
  ],
  citizen: [
    {
      id: "meningitis-bivalent-citizen",
      nameAr: "السحائي الثنائي",
      nameEn: "Bivalent meningococcal",
      priceEgp: 200,
      free: false,
    },
    {
      id: "flu-seasonal-citizen",
      nameAr: "الإنفلونزا الموسمية",
      nameEn: "Seasonal influenza",
      priceEgp: 260,
      free: false,
    },
    {
      id: "hepatitis-b-egyptian-citizen",
      nameAr: "الكبدي — مصري",
      nameEn: "Hepatitis B (Egyptian)",
      priceEgp: 100,
      free: false,
    },
    {
      id: "hepatitis-b-foreign-citizen",
      nameAr: "الكبدي — أجنبي",
      nameEn: "Hepatitis B (foreign)",
      priceEgp: 200,
      free: false,
    },
    {
      id: "hepatitis-b-egyptian-travel-citizen",
      nameAr: "الكبدي — مصري ومسافر للخارج",
      nameEn: "Hepatitis B (Egyptian, travelling abroad)",
      priceEgp: 150,
      free: false,
    },
    {
      id: "hepatitis-b-foreign-travel-citizen",
      nameAr: "الكبدي — أجنبي ومسافر",
      nameEn: "Hepatitis B (foreign traveller)",
      priceEgp: 300,
      free: false,
    },
  ],
};
