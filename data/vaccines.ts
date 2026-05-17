/**
 * Vaccine catalog grouped by audience.
 * Replace or sync from API / imported JSON (e.g. Excel → JSON) without changing UI logic.
 */
export type UserCategory = "international" | "hajj" | "umrah" | "citizen";

export type VaccineRecord = {
  id: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
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
      nameFr: "Meningococcique quadrivalent (voyageurs internationaux)",
      priceEgp: 800,
      free: false,
    },
    {
      id: "yellow-fever",
      nameAr: "الحمى الصفراء",
      nameEn: "Yellow fever",
      nameFr: "Fievre jaune",
      priceEgp: 1250,
      free: false,
    },
    {
      id: "cholera",
      nameAr: "الكوليرا",
      nameEn: "Cholera",
      nameFr: "Cholera",
      priceEgp: 360,
      free: false,
    },
    {
      id: "polio",
      nameAr: "شلل الأطفال",
      nameEn: "Polio",
      nameFr: "Poliomyelite",
      priceEgp: 80,
      free: false,
    },
    {
      id: "seasonal-flu",
      nameAr: "الإنفلونزا الموسمية",
      nameEn: "Seasonal influenza",
      nameFr: "Grippe saisonniere",
      priceEgp: 260,
      free: false,
    },
    {
      id: "malaria",
      nameAr: "الملاريا",
      nameEn: "Malaria",
      nameFr: "Paludisme",
      priceEgp: null,
      free: true,
    },
  ],
  hajj: [
    {
      id: "meningitis-quad-hajj",
      nameAr: "السحائي الرباعي للحج",
      nameEn: "Quadrivalent meningococcal (Hajj)",
      nameFr: "Meningococcique quadrivalent (Hajj)",
      priceEgp: 670,
      free: false,
    },
    {
      id: "flu-seasonal-hajj",
      nameAr: "الإنفلونزا الموسمية",
      nameEn: "Seasonal influenza",
      nameFr: "Grippe saisonniere",
      priceEgp: 260,
      free: false,
    },
  ],
  umrah: [
    {
      id: "meningitis-bivalent-umrah",
      nameAr: "السحائي الثنائي",
      nameEn: "Bivalent meningococcal",
      nameFr: "Meningococcique bivalent",
      priceEgp: 200,
      free: false,
    },
    {
      id: "flu-seasonal-umrah",
      nameAr: "الإنفلونزا الموسمية",
      nameEn: "Seasonal influenza",
      nameFr: "Grippe saisonniere",
      priceEgp: 260,
      free: false,
    },
  ],
  citizen: [
    {
      id: "meningitis-bivalent-citizen",
      nameAr: "السحائي الثنائي",
      nameEn: "Bivalent meningococcal",
      nameFr: "Meningococcique bivalent",
      priceEgp: 200,
      free: false,
    },
    {
      id: "flu-seasonal-citizen",
      nameAr: "الإنفلونزا الموسمية",
      nameEn: "Seasonal influenza",
      nameFr: "Grippe saisonniere",
      priceEgp: 260,
      free: false,
    },
    {
      id: "hepatitis-b-egyptian-citizen",
      nameAr: "الكبدي — مصري",
      nameEn: "Hepatitis B (Egyptian)",
      nameFr: "Hepatite B (Egyptien)",
      priceEgp: 100,
      free: false,
    },
    {
      id: "hepatitis-b-foreign-citizen",
      nameAr: "الكبدي — أجنبي",
      nameEn: "Hepatitis B (foreign)",
      nameFr: "Hepatite B (etranger)",
      priceEgp: 200,
      free: false,
    },
    {
      id: "hepatitis-b-egyptian-travel-citizen",
      nameAr: "الكبدي — مصري ومسافر للخارج",
      nameEn: "Hepatitis B (Egyptian, travelling abroad)",
      nameFr: "Hepatite B (Egyptien voyageant a l'etranger)",
      priceEgp: 150,
      free: false,
    },
    {
      id: "hepatitis-b-foreign-travel-citizen",
      nameAr: "الكبدي — أجنبي ومسافر",
      nameEn: "Hepatitis B (foreign traveller)",
      nameFr: "Hepatite B (voyageur etranger)",
      priceEgp: 300,
      free: false,
    },
  ],
};
