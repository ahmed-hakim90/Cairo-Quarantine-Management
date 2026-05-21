import type { VaccineRecord } from "@/data/vaccines";
import { VACCINES_BY_CATEGORY } from "@/data/vaccines";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";
import { isOfficeOrAreaQuery } from "@/lib/chat/office-area-query";
import { buildOfficeResponse } from "@/lib/chat/office-response";
import { formatPortalUrl } from "@/lib/chat/site-knowledge";
import {
  searchSiteKnowledge,
  type SiteKnowledgeEntry,
} from "@/lib/chat/site-knowledge";

function getLocale(localeValue: string | undefined) {
  return localeValue && isLocale(localeValue) ? localeValue : defaultLocale;
}

function isPriceQuestion(normalized: string) {
  return (
    normalized.includes("تكلف") ||
    normalized.includes("سعر") ||
    normalized.includes("بكم") ||
    normalized.includes("كام") ||
    normalized.includes("جنيه") ||
    normalized.includes("egp") ||
    normalized.includes("مصاريف") ||
    normalized.includes("price") ||
    normalized.includes("cost")
  );
}

function isBookingQuestion(normalized: string) {
  return (
    normalized.includes("حجز") ||
    normalized.includes("موعد") ||
    normalized.includes("booking") ||
    normalized.includes("appointment")
  );
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
}: {
  locale: string | undefined;
  message: string;
  knowledgeIndex: SiteKnowledgeEntry[];
}): string | null {
  const normalized = normalizeArabic(message);
  const mentionsUmrah =
    normalized.includes("عمره") || normalized.includes("معتم");
  const mentionsHajj = normalized.includes("حج") || normalized.includes("حاج");
  if (isBookingQuestion(normalized)) return buildBookingResponse(locale);

  const hits = searchSiteKnowledge(message, knowledgeIndex, 5);

  if (isOfficeOrAreaQuery(normalized)) {
    return buildOfficeResponse(locale, message, hits);
  }

  if (isPriceQuestion(normalized)) {
    if (mentionsUmrah && !mentionsHajj) return buildVaccinePriceResponse(locale, "umrah");
    if (mentionsHajj && !mentionsUmrah) return buildVaccinePriceResponse(locale, "hajj");
    return buildVaccinePriceResponse(locale, "both");
  }

  if (mentionsHajj || mentionsUmrah) return buildHajjResponse(locale);

  if (hits.length > 0) return buildSearchHitResponse(locale, hits[0]);

  return null;
}
