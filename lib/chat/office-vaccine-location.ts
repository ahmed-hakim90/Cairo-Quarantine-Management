import type { Locale } from "@/lib/i18n/config";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { googleMapsOfficeSearchUrl } from "@/lib/google-maps-url";
import {
  buildChatOfficeCatalog,
  type ChatOffice,
} from "@/lib/chat/office-catalog";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";
import { findVaccinationCenters } from "@/lib/chat/vaccination-center-search";
import { formatPortalUrl } from "@/lib/chat/site-knowledge";
import type { PortalAssistantResponse } from "@/lib/chat/portal-assistant-types";

const SPECIFIC_VACCINE_SIGNALS = [
  "كبد",
  "كبدي",
  "سحائي",
  "انفلونزا",
  "كوليرا",
  "شلل",
  "ملاريا",
  "حمى",
];

const WHERE_SIGNALS = ["اين", "فين", "وين", "مكتب", "مكان", "مركز", "احصل"];

function getLocale(localeValue: string | undefined): Locale {
  return localeValue && isLocale(localeValue) ? localeValue : defaultLocale;
}

export function isVaccineLocationQuery(message: string): boolean {
  const normalized = normalizeArabic(message);
  const hasVaccine = SPECIFIC_VACCINE_SIGNALS.some((s) => normalized.includes(s));
  const hasWhere = WHERE_SIGNALS.some((s) => normalized.includes(s));
  return hasVaccine && (hasWhere || normalized.includes("اين"));
}

function resolveMapUrl(office: ChatOffice, locale: Locale): string {
  const direct = office.mapsUrl?.trim();
  if (direct) return direct;
  return googleMapsOfficeSearchUrl({
    placeTitle: office.centerNameAr,
    address: office.addressAr,
    locale,
  });
}

function findAirportOffice(catalog: ChatOffice[]): ChatOffice | null {
  return (
    catalog.find((o) => {
      const hay = normalizeArabic(
        `${o.centerNameAr} ${o.administrationAr}`,
      );
      return hay.includes("مطار");
    }) ?? null
  );
}

function formatSpecOfficeBlock(office: ChatOffice, locale: Locale): string {
  const title =
    locale === "en"
      ? office.centerNameEn
      : locale === "fr"
        ? office.centerNameFr
        : office.centerNameAr;
  const address =
    locale === "en"
      ? office.addressEn
      : locale === "fr"
        ? office.addressFr
        : office.addressAr;
  const mapsUrl = resolveMapUrl(office, locale);
  const mapPrefix =
    locale === "en"
      ? "Map"
      : locale === "fr"
        ? "Carte"
        : locale === "zh"
          ? "地图"
          : "الخريطة";
  return `${title}\n${address}\n${mapPrefix}: [${mapPrefix}](${mapsUrl})`;
}

export function buildVaccineLocationResponse(
  localeValue: string | undefined,
  message: string,
): PortalAssistantResponse | null {
  if (!isVaccineLocationQuery(message)) return null;

  const locale = getLocale(localeValue);
  const normalized = normalizeArabic(message);
  const catalog = buildChatOfficeCatalog();
  const airport = findAirportOffice(catalog);
  const prefersInternational =
    normalized.includes("دولي") ||
    normalized.includes("مسافر") ||
    normalized.includes("مطار") ||
    normalized.includes("خارج");

  const intro =
    locale === "en"
      ? "Available at:"
      : locale === "fr"
        ? "Disponible à :"
        : locale === "zh"
          ? "可在以下地点获得："
          : "يمكن الحصول عليه من:";

  const blocks: string[] = [];

  if (airport && (prefersInternational || normalized.includes("كبد"))) {
    blocks.push(formatSpecOfficeBlock(airport, locale));
  }

  const areaCenters = findVaccinationCenters(message, 3);
  for (const center of areaCenters) {
    if (airport && center.id === airport.id) continue;
    blocks.push(formatSpecOfficeBlock(center, locale));
    if (blocks.length >= 3) break;
  }

  if (blocks.length === 0 && airport) {
    blocks.push(formatSpecOfficeBlock(airport, locale));
  }

  if (blocks.length === 0) {
    return null;
  }

  const source =
    blocks.length === 1 && airport
      ? airport.centerNameAr
      : locale === "en"
        ? "Traveller vaccination offices"
        : "قائمة المكاتب";

  return {
    answer: `${intro}\n${blocks.join("\n")}`,
    source,
    type: "office",
    confidence: 0.9,
  };
}
