import type { VaccineRecord } from "@/data/vaccines";
import { VACCINES_BY_CATEGORY } from "@/data/vaccines";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";
import { buildDestinationCountryResponse } from "@/lib/chat/destination-country-response";
import { classifyChatIntent } from "@/lib/chat/intent";
import { buildOfficeResponse } from "@/lib/chat/office-response";
import { formatPortalUrl } from "@/lib/chat/site-knowledge";
import {
  searchSiteKnowledge,
  type SiteKnowledgeEntry,
} from "@/lib/chat/site-knowledge";
import type { DestinationCountry } from "@/lib/office-requests/types";

function getLocale(localeValue: string | undefined) {
  return localeValue && isLocale(localeValue) ? localeValue : defaultLocale;
}

function vaccineDisplayName(record: VaccineRecord, locale: string) {
  if (locale === "en" || locale === "zh" || locale === "fr") return record.nameEn;
  return record.nameAr;
}

function buildBookingResponse(localeValue: string | undefined) {
  const loc = getLocale(localeValue);
  const path = formatPortalUrl(loc, "booking");
  if (loc === "en") {
    return `Book a vaccination appointment from the portal booking page.\n[Open booking](${path})`;
  }
  if (loc === "zh") {
    return `请通过门户网站预约页面提交预约。\n[打开预约](${path})`;
  }
  if (loc === "fr") {
    return `Prenez rendez-vous via la page de reservation du portail.\n[Ouvrir la reservation](${path})`;
  }
  return `يمكنك الحجز من صفحة الحجز في البوابة.\n[فتح صفحة الحجز](${path})`;
}

function buildVaccinePriceResponse(
  localeValue: string | undefined,
  trip: "umrah" | "hajj" | "both",
) {
  const loc = getLocale(localeValue);
  const messages = getMessages(loc);
  const currency = messages.vaccineSelector.currency;
  const freeLabel = loc === "en" ? "free" : "مجاناً";
  const path = formatPortalUrl(loc, "hajj-umrah");

  const lines =
    trip === "umrah"
      ? VACCINES_BY_CATEGORY.umrah
      : trip === "hajj"
        ? VACCINES_BY_CATEGORY.hajj
        : [...VACCINES_BY_CATEGORY.umrah.slice(0, 2), ...VACCINES_BY_CATEGORY.hajj.slice(0, 2)];

  const sample = lines
    .slice(0, 3)
    .map((record) => {
      const name = vaccineDisplayName(record, loc);
      if (record.free) return `${name}: ${freeLabel}`;
      if (record.priceEgp == null) return `${name}: —`;
      return `${name}: ${record.priceEgp} ${currency}`;
    })
    .join("؛ ");

  if (loc === "en") {
    return `Indicative prices from the portal (confirm at the centre):\n${sample}\n[Details](${path})`;
  }
  return `أسعار استرشادية من بيانات البوابة (يُؤكد السعر في المركز):\n${sample}\n[التفاصيل](${path})`;
}

function buildHajjResponse(localeValue: string | undefined) {
  const loc = getLocale(localeValue);
  const hajj = getMessages(loc).pages.hajj;
  const path = formatPortalUrl(loc, "hajj-umrah");

  if (loc === "en") {
    return `Hajj/Umrah: ${hajj.basicsBody}\nDocuments: ${hajj.documentBullets.join(", ")}.\n[Full guide](${path})`;
  }
  return `الحج والعمرة: ${hajj.basicsBody}\nالوثائق: ${hajj.documentBullets.join("، ")}.\n[الدليل الكامل](${path})`;
}

function buildServicesResponse(
  localeValue: string | undefined,
  knowledgeIndex: SiteKnowledgeEntry[],
) {
  const loc = getLocale(localeValue);
  const servicesHit =
    knowledgeIndex.find((entry) => entry.id === "services") ??
    searchSiteKnowledge(
      loc === "en" ? "services" : "خدمات",
      knowledgeIndex,
      3,
    )[0];

  const m = getMessages(loc).services;
  const path = formatPortalUrl(loc);

  if (servicesHit) {
    return `${servicesHit.body.slice(0, 280)}\n[${servicesHit.title}](${servicesHit.path || path})`;
  }

  if (loc === "en") {
    return `${m.intro}\n${m.internationalTitle}: ${m.internationalDesc}\n${m.hajjTitle}: ${m.hajjDesc}\n[Services](${path})`;
  }
  return `${m.intro}\n${m.internationalTitle}: ${m.internationalDesc}\n${m.hajjTitle}: ${m.hajjDesc}\n[الخدمات](${path})`;
}

function buildSearchHitResponse(
  localeValue: string | undefined,
  hit: SiteKnowledgeEntry,
) {
  const loc = getLocale(localeValue);
  if (loc === "en") {
    return `${hit.body.slice(0, 200)}\n[${hit.title}](${hit.path})`;
  }
  return `${hit.body.slice(0, 200)}\n[${hit.title}](${hit.path})`;
}

export function getLocalChatResponse({
  locale,
  message,
  knowledgeIndex,
  destinationCountries = [],
}: {
  locale: string | undefined;
  message: string;
  knowledgeIndex: SiteKnowledgeEntry[];
  destinationCountries?: DestinationCountry[];
}): string | null {
  const normalized = normalizeArabic(message);
  const mentionsUmrah =
    normalized.includes("عمره") || normalized.includes("معتم");
  const mentionsHajj = normalized.includes("حج") || normalized.includes("حاج");

  const intent = classifyChatIntent(message, { destinationCountries });
  const hits = searchSiteKnowledge(message, knowledgeIndex, 5);

  switch (intent) {
    case "price":
      if (mentionsUmrah && !mentionsHajj) {
        return buildVaccinePriceResponse(locale, "umrah");
      }
      if (mentionsHajj && !mentionsUmrah) {
        return buildVaccinePriceResponse(locale, "hajj");
      }
      return buildVaccinePriceResponse(locale, "both");
    case "booking":
      return buildBookingResponse(locale);
    case "services":
      return buildServicesResponse(locale, knowledgeIndex);
    case "destination_vaccines":
      return buildDestinationCountryResponse(locale, message, destinationCountries);
    case "hajj_umrah":
      return buildHajjResponse(locale);
    case "office":
      return buildOfficeResponse(locale, message, hits);
    case "general":
      if (hits.length > 0) return buildSearchHitResponse(locale, hits[0]);
      return null;
  }
}
