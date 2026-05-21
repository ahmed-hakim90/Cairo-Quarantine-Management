import type { UserCategory, VaccineRecord } from "@/data/vaccines";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";
import { formatPortalUrl } from "@/lib/chat/site-knowledge";
import type { PortalAssistantResponse } from "@/lib/chat/portal-assistant-types";

const PRICE_SOURCE_AR = "التطعيمات والأسعار التوجيهية";
const PRICE_DISCLAIMER_AR =
  "الأسعار استرشادية ويؤكد السعر النهائي بالمركز.";

const VACCINE_ALIASES: Array<{ tokens: string[]; match: (name: string) => boolean }> = [
  { tokens: ["سحائي", "ثنائي"], match: (n) => n.includes("سحائي") && n.includes("ثنائي") },
  { tokens: ["سحائي", "رباعي", "حج"], match: (n) => n.includes("سحائي") && n.includes("رباعي") && n.includes("حج") },
  { tokens: ["سحائي", "رباعي"], match: (n) => n.includes("سحائي") && n.includes("رباعي") },
  { tokens: ["انفلونزا", "موسم"], match: (n) => n.includes("انفلونزا") },
  { tokens: ["كبد"], match: (n) => n.includes("كبد") },
  { tokens: ["حمى", "صفر"], match: (n) => n.includes("حمى") && n.includes("صفر") },
  { tokens: ["كوليرا"], match: (n) => n.includes("كوليرا") },
  { tokens: ["شلل"], match: (n) => n.includes("شلل") },
  { tokens: ["ملاريا"], match: (n) => n.includes("ملاريا") },
];

function getLocale(localeValue: string | undefined) {
  return localeValue && isLocale(localeValue) ? localeValue : defaultLocale;
}

function vaccineDisplayName(record: VaccineRecord, locale: string) {
  if (locale === "en" || locale === "zh" || locale === "fr") return record.nameEn;
  return record.nameAr;
}

function formatPriceLine(
  record: VaccineRecord,
  locale: string,
  currency: string,
  freeLabel: string,
): string {
  const name = vaccineDisplayName(record, locale);
  if (record.free) return `${name}: ${freeLabel}`;
  if (record.priceEgp == null) return `${name}: —`;
  if (locale === "en") return `${name}: ${record.priceEgp} ${currency}`;
  return `${name}: ${record.priceEgp} جنيه`;
}

function detectCategory(
  normalized: string,
  mentionsHajj: boolean,
  mentionsUmrah: boolean,
): UserCategory | "both_hajj_umrah" | null {
  if (
    normalized.includes("مواطن") ||
    normalized.includes("citizen")
  ) {
    return "citizen";
  }
  if (
    normalized.includes("دولي") ||
    normalized.includes("مسافر") ||
    normalized.includes("خارج")
  ) {
    return "international";
  }
  if (mentionsUmrah && !mentionsHajj) return "umrah";
  if (mentionsHajj && !mentionsUmrah) return "hajj";
  if (mentionsHajj || mentionsUmrah) return "both_hajj_umrah";
  return null;
}

function recordMatchesQuery(record: VaccineRecord, normalized: string): boolean {
  const nameNorm = normalizeArabic(record.nameAr);
  for (const alias of VACCINE_ALIASES) {
    if (!alias.match(nameNorm)) continue;
    if (alias.tokens.every((t) => normalized.includes(t))) return true;
  }
  const parts = nameNorm.split(" ").filter((p) => p.length >= 4);
  return parts.some((p) => normalized.includes(p));
}

function findMatchingVaccines(
  message: string,
  vaccinesByCategory: Record<UserCategory, VaccineRecord[]>,
): VaccineRecord[] {
  const normalized = normalizeArabic(message);
  const all = [
    ...vaccinesByCategory.international,
    ...vaccinesByCategory.hajj,
    ...vaccinesByCategory.umrah,
    ...vaccinesByCategory.citizen,
  ];
  const seen = new Set<string>();
  const matches: VaccineRecord[] = [];

  for (const record of all) {
    if (!recordMatchesQuery(record, normalized)) continue;
    if (seen.has(record.id)) continue;
    seen.add(record.id);
    matches.push(record);
  }

  return matches;
}

function categoryRecords(
  vaccinesByCategory: Record<UserCategory, VaccineRecord[]>,
  trip: "umrah" | "hajj" | "both",
): VaccineRecord[] {
  if (trip === "umrah") return vaccinesByCategory.umrah;
  if (trip === "hajj") return vaccinesByCategory.hajj;
  return [...vaccinesByCategory.umrah, ...vaccinesByCategory.hajj];
}

export function buildVaccinePriceAssistantResponse(
  localeValue: string | undefined,
  message: string,
  vaccinesByCategory: Record<UserCategory, VaccineRecord[]>,
): PortalAssistantResponse {
  const loc = getLocale(localeValue);
  const messages = getMessages(loc);
  const currency = messages.vaccineSelector.currency;
  const freeLabel = loc === "en" ? "free" : "مجاناً";
  const normalized = normalizeArabic(message);
  const mentionsUmrah =
    normalized.includes("عمره") || normalized.includes("معتم");
  const mentionsHajj = normalized.includes("حج") || normalized.includes("حاج");

  const specific = findMatchingVaccines(message, vaccinesByCategory);
  if (specific.length === 1) {
    const line = formatPriceLine(specific[0], loc, currency, freeLabel);
    if (loc === "en") {
      return {
        answer: `${line}\nIndicative prices; confirm the final price at the centre.`,
        source: "Vaccines and indicative prices",
        type: "price",
        confidence: 0.95,
      };
    }
    return {
      answer: `${line}\n${PRICE_DISCLAIMER_AR}`,
      source: PRICE_SOURCE_AR,
      type: "price",
      confidence: 0.95,
    };
  }

  if (specific.length > 1) {
    const lines = specific
      .map((r) => formatPriceLine(r, loc, currency, freeLabel))
      .join("\n");
    return {
      answer:
        loc === "en"
          ? `${lines}\nIndicative prices; confirm at the centre.`
          : `${lines}\n${PRICE_DISCLAIMER_AR}`,
      source: PRICE_SOURCE_AR,
      type: "price",
      confidence: 0.9,
    };
  }

  const category = detectCategory(normalized, mentionsHajj, mentionsUmrah);
  let records: VaccineRecord[];
  if (category === "citizen") records = vaccinesByCategory.citizen;
  else if (category === "international")
    records = vaccinesByCategory.international;
  else if (category === "umrah") records = vaccinesByCategory.umrah;
  else if (category === "hajj") records = vaccinesByCategory.hajj;
  else if (category === "both_hajj_umrah") {
    records = categoryRecords(vaccinesByCategory, "both");
  } else if (mentionsUmrah && !mentionsHajj) {
    records = vaccinesByCategory.umrah;
  } else if (mentionsHajj && !mentionsUmrah) {
    records = vaccinesByCategory.hajj;
  } else {
    records = categoryRecords(vaccinesByCategory, "both");
  }

  const lines = records
    .map((r) => formatPriceLine(r, loc, currency, freeLabel))
    .join("\n");

  if (loc === "en") {
    return {
      answer: `${lines}\nIndicative prices; confirm the final price at the centre.`,
      source: "Vaccines and indicative prices",
      type: "price",
      confidence: 0.85,
    };
  }

  return {
    answer: `${lines}\n${PRICE_DISCLAIMER_AR}`,
    source: PRICE_SOURCE_AR,
    type: "price",
    confidence: 0.85,
  };
}
