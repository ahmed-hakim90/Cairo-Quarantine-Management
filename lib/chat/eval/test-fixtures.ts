import type { DestinationCountry } from "@/lib/office-requests/types";

export const MOCK_TURKEY: DestinationCountry = {
  id: "tr",
  nameEn: "Turkey",
  nameAr: "تركيا",
  requirementsAr: "تطعيمات مطلوبة قبل السفر إلى تركيا.",
  sortOrder: 1,
};

export const MOCK_SAUDI: DestinationCountry = {
  id: "sa",
  nameEn: "Saudi Arabia",
  nameAr: "السعودية",
  requirementsAr: "تطعيمات مطلوبة قبل السفر للسعودية.",
  sortOrder: 2,
};

export const EVAL_DESTINATION_COUNTRIES = [MOCK_TURKEY, MOCK_SAUDI];
