import type { Locale } from "@/lib/i18n/config";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { googleMapsOfficeSearchUrl } from "@/lib/google-maps-url";
import { formatPortalUrl } from "@/lib/chat/site-knowledge";
import type { SiteKnowledgeEntry } from "@/lib/chat/site-knowledge";
import type { ChatOffice } from "@/lib/chat/office-catalog";
import { findVaccinationCenters } from "@/lib/chat/vaccination-center-search";
import { buildVaccineLocationResponse } from "@/lib/chat/office-vaccine-location";
import type { PortalAssistantResponse } from "@/lib/chat/portal-assistant-types";

function getLocale(localeValue: string | undefined): Locale {
  return localeValue && isLocale(localeValue) ? localeValue : defaultLocale;
}

function telHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits || digits.length < 8) return null;
  return `tel:${digits}`;
}

function resolveOfficeMapUrlForChat(office: ChatOffice, locale: Locale): string {
  const direct = office.mapsUrl?.trim();
  if (direct) return direct;
  return googleMapsOfficeSearchUrl({
    placeTitle: office.centerNameAr,
    address: office.addressAr,
    locale,
  });
}

function centerTitle(office: ChatOffice, locale: Locale): string {
  if (locale === "en") return office.centerNameEn;
  if (locale === "fr") return office.centerNameFr;
  return office.centerNameAr;
}

function centerAddress(office: ChatOffice, locale: Locale): string {
  if (locale === "en") return office.addressEn;
  if (locale === "fr") return office.addressFr;
  return office.addressAr;
}

function administrationLabel(office: ChatOffice, locale: Locale): string {
  if (locale === "en") return office.administrationEn;
  if (locale === "fr") return office.administrationFr;
  return office.administrationAr;
}

function formatCenterBlock(office: ChatOffice, locale: Locale): string {
  const title = centerTitle(office, locale);
  const admin = administrationLabel(office, locale);
  const address = centerAddress(office, locale);
  const phoneLink = office.phone && office.phone !== "—" ? telHref(office.phone) : null;
  const mapsUrl = resolveOfficeMapUrlForChat(office, locale);

  const contactParts: string[] = [];
  if (phoneLink) {
    const phoneLabel =
      locale === "en" ? "Call" : locale === "fr" ? "Appeler" : locale === "zh" ? "电话" : "اتصال";
    contactParts.push(`[${phoneLabel}](${phoneLink})`);
  }
  const mapLabel =
    locale === "en"
      ? "Open map"
      : locale === "fr"
        ? "Carte"
        : locale === "zh"
          ? "地图"
          : "فتح الخريطة";
  contactParts.push(`[${mapLabel}](${mapsUrl})`);

  return `${title} (${admin})\n${address}\n${contactParts.join(" ")}`;
}

function allOfficesLink(locale: Locale): string {
  const path = `${formatPortalUrl(locale)}#locations-heading`;
  const label =
    locale === "en"
      ? "All offices"
      : locale === "fr"
        ? "Tous les bureaux"
        : locale === "zh"
          ? "所有办事处"
          : "كل المكاتب";
  return `[${label}](${path})`;
}

function introLine(count: number, locale: Locale): string {
  if (count <= 1) return "";
  if (locale === "en") return `${count} offices in this area:\n`;
  if (locale === "fr") return `${count} bureaux dans cette zone :\n`;
  if (locale === "zh") return `该区域有 ${count} 个办事处：\n`;
  return `${count} مكاتب في المنطقة:\n`;
}

function genericOfficeFallback(locale: Locale): PortalAssistantResponse {
  const path = `${formatPortalUrl(locale)}#locations-heading`;
  const answer =
    locale === "en"
      ? `See traveller vaccination offices in the portal table.\n[Office locations](${path})`
      : locale === "zh"
        ? `请查看门户上的旅行者疫苗接种办公室表格。\n[办事处位置](${path})`
        : locale === "fr"
          ? `Consultez le tableau des bureaux de vaccination sur le portail.\n[Emplacements](${path})`
          : `راجع جدول مكاتب تطعيم المسافرين في البوابة.\n[مواقع المكاتب](${path})`;

  return {
    answer,
    source: locale === "ar" ? "قائمة المكاتب" : "Office list",
    type: "office",
    confidence: 0.75,
  };
}

export function buildOfficeAssistantResponse(
  localeValue: string | undefined,
  message: string,
  knowledgeHits: SiteKnowledgeEntry[],
): PortalAssistantResponse {
  const vaccineLocation = buildVaccineLocationResponse(localeValue, message);
  if (vaccineLocation) return vaccineLocation;

  const locale = getLocale(localeValue);
  const centers = findVaccinationCenters(message, 8);

  if (centers.length > 0) {
    const blocks = centers.map((row) => formatCenterBlock(row, locale));
    return {
      answer: `${introLine(centers.length, locale)}${blocks.join("\n")}\n${allOfficesLink(locale)}`,
      source:
        centers.length === 1
          ? centers[0].centerNameAr
          : locale === "ar"
            ? "قائمة المكاتب"
            : "Traveller vaccination offices",
      type: "office",
      confidence: centers.length === 1 ? 0.95 : 0.9,
    };
  }

  const officeHits = knowledgeHits
    .filter((h) => h.category === "offices")
    .slice(0, 2);

  if (officeHits.length === 0) {
    return genericOfficeFallback(locale);
  }

  const lines = officeHits
    .map((o) => `${o.title}: ${o.body.slice(0, 280)}`)
    .join("\n");
  const tableLabel =
    locale === "en" ? "Office table" : locale === "fr" ? "Tableau" : locale === "zh" ? "表格" : "جدول المكاتب";

  return {
    answer: `${lines}\n[${tableLabel}](${formatPortalUrl(locale)}#locations-heading)`,
    source: officeHits[0].title,
    type: "office",
    confidence: 0.85,
  };
}

/** @deprecated Use buildOfficeAssistantResponse */
export function buildOfficeResponse(
  localeValue: string | undefined,
  message: string,
  knowledgeHits: SiteKnowledgeEntry[],
): string {
  return buildOfficeAssistantResponse(localeValue, message, knowledgeHits).answer;
}
