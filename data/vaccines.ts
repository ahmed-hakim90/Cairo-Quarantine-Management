/**
 * Vaccine catalog grouped by audience.
 * Replace or sync from API / imported JSON (e.g. Excel → JSON) without changing UI logic.
 */
export type UserCategory = "international" | "hajj" | "umrah" | "citizen";

export type VaccineRecord = {
  id: string;
  nameAr: string;
  /** Price in EGP; ignored when free is true */
  priceEgp: number | null;
  free: boolean;
};

export const USER_CATEGORY_LABELS: Record<UserCategory, string> = {
  international: "مسافر دولي",
  hajj: "حج",
  umrah: "عمرة",
  citizen: "مواطن",
};

export const VACCINES_BY_CATEGORY: Record<UserCategory, VaccineRecord[]> = {
  international: [
    {
      id: "yellow-fever",
      nameAr: "حمى صفراء",
      priceEgp: null,
      free: true,
    },
    {
      id: "meningitis-acyw",
      nameAr: "التهاب السحايا رباعي التكافؤ (ACYW)",
      priceEgp: 450,
      free: false,
    },
    {
      id: "covid-19",
      nameAr: "كوفيد-19",
      priceEgp: 350,
      free: false,
    },
    {
      id: "polio-ipv",
      nameAr: "شلل الأطفال (المحقن IPV)",
      priceEgp: null,
      free: true,
    },
  ],
  hajj: [
    {
      id: "meningitis-required",
      nameAr: "التهاب السحايا (إلزامي للحج)",
      priceEgp: null,
      free: true,
    },
    {
      id: "flu-seasonal",
      nameAr: "الإنفلونزا الموسمية",
      priceEgp: 200,
      free: false,
    },
    {
      id: "covid-19-booster",
      nameAr: "جرعة معززة كوفيد-19",
      priceEgp: 300,
      free: false,
    },
  ],
  umrah: [
    {
      id: "meningitis-required-umrah",
      nameAr: "التهاب السحايا (إلزامي للعمرة)",
      priceEgp: null,
      free: true,
    },
    {
      id: "flu-seasonal-u",
      nameAr: "الإنفلونزا الموسمية",
      priceEgp: 200,
      free: false,
    },
    {
      id: "covid-19-u",
      nameAr: "كوفيد-19",
      priceEgp: 300,
      free: false,
    },
  ],
  citizen: [
    {
      id: "hepatitis-b",
      nameAr: "التهاب الكبد ب",
      priceEgp: 180,
      free: false,
    },
    {
      id: "mmr",
      nameAr: "الحصبة والنكاف والحصبة الألمانية",
      priceEgp: null,
      free: true,
    },
    {
      id: "tdap",
      nameAr: "التيتانوس والدفتيريا والسعال الديكي",
      priceEgp: 220,
      free: false,
    },
    {
      id: "hepatitis-a",
      nameAr: "التهاب الكبد أ",
      priceEgp: 350,
      free: false,
    },
  ],
};
