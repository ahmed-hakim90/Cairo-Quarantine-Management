import type { Locale } from "@/lib/i18n/config";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { googleMapsOfficeSearchUrl } from "@/lib/google-maps-url";
import type { ChatOffice } from "@/lib/chat/office-catalog";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";
import { formatPortalUrl } from "@/lib/chat/site-knowledge";
import { findVaccinationCenters } from "@/lib/chat/vaccination-center-search";
import { getOfficeWorkingHoursTableLabel } from "@/lib/office-working-hours";
import type { Office } from "@/lib/office-requests/types";

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

function stubOfficeFromChat(chatOffice: ChatOffice): Office {
  return {
    id: chatOffice.id,
    governorateId: "",
    serialInGovernorate: 0,
    administrationAr: chatOffice.administrationAr,
    nameAr: chatOffice.centerNameAr,
    addressAr: chatOffice.addressAr,
    phone: chatOffice.phone === "—" ? null : chatOffice.phone,
    mapsUrl: chatOffice.mapsUrl ?? "",
    service: "hajj_umrah_travelers",
    active: true,
  };
}

function resolvePortalOffice(
  chatOffice: ChatOffice,
  portalOffices: Office[],
): Office {
  const byId = portalOffices.find((o) => o.id === chatOffice.id);
  if (byId) return byId;

  const nameNorm = normalizeArabic(chatOffice.centerNameAr);
  const addressNorm = normalizeArabic(chatOffice.addressAr);

  for (const office of portalOffices) {
    const officeName = normalizeArabic(office.nameAr);
    const officeAddress = normalizeArabic(office.addressAr);
    if (
      officeName === nameNorm ||
      (nameNorm.length >= 4 && officeName.includes(nameNorm)) ||
      (officeName.length >= 4 && nameNorm.includes(officeName))
    ) {
      if (
        !addressNorm ||
        !officeAddress ||
        officeAddress.includes(addressNorm) ||
        addressNorm.includes(officeAddress)
      ) {
        return office;
      }
    }
  }

  return stubOfficeFromChat(chatOffice);
}

function hoursHeading(locale: Locale): string {
  if (locale === "en") return "Working hours";
  if (locale === "fr") return "Horaires";
  if (locale === "zh") return "营业时间";
  return "مواعيد العمل";
}

function formatHoursBlock(
  chatOffice: ChatOffice,
  portalOffices: Office[],
  locale: Locale,
): string {
  const portalOffice = resolvePortalOffice(chatOffice, portalOffices);
  const hours = getOfficeWorkingHoursTableLabel(portalOffice, locale);
  const title =
    locale === "en" ? chatOffice.centerNameEn : chatOffice.centerNameAr;
  const admin =
    locale === "en"
      ? chatOffice.administrationEn
      : chatOffice.administrationAr;

  const phoneLink =
    chatOffice.phone && chatOffice.phone !== "—"
      ? telHref(chatOffice.phone)
      : null;
  const mapsUrl = resolveOfficeMapUrlForChat(chatOffice, locale);

  const contactParts: string[] = [];
  if (phoneLink) {
    const phoneLabel =
      locale === "en"
        ? "Call"
        : locale === "fr"
          ? "Appeler"
          : locale === "zh"
            ? "电话"
            : "اتصال";
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

  return `${title} (${admin})\n${hoursHeading(locale)}: ${hours}\n${contactParts.join(" ")}`;
}

function introLine(count: number, locale: Locale): string {
  if (count <= 1) return "";
  if (locale === "en") return `${count} offices in this area:\n`;
  if (locale === "fr") return `${count} bureaux dans cette zone :\n`;
  if (locale === "zh") return `该区域有 ${count} 个办事处：\n`;
  return `${count} مكاتب في المنطقة:\n`;
}

function genericHoursFallback(locale: Locale): string {
  const path = `${formatPortalUrl(locale)}#locations-heading`;
  if (locale === "en") {
    return `See office working hours in the portal locations table.\n[Office locations](${path})`;
  }
  return `راجع مواعيد عمل المكاتب في جدول المواقع على البوابة.\n[مواقع المكاتب](${path})`;
}

export function buildOfficeHoursResponse(
  localeValue: string | undefined,
  message: string,
  portalOffices: Office[],
): string {
  const locale = getLocale(localeValue);
  const centers = findVaccinationCenters(message, 8);

  if (centers.length === 0) {
    return genericHoursFallback(locale);
  }

  const blocks = centers.map((row) =>
    formatHoursBlock(row, portalOffices, locale),
  );
  const allLabel =
    locale === "en"
      ? "All offices"
      : locale === "fr"
        ? "Tous les bureaux"
        : locale === "zh"
          ? "所有办事处"
          : "كل المكاتب";

  return `${introLine(centers.length, locale)}${blocks.join("\n")}\n[${allLabel}](${formatPortalUrl(locale)}#locations-heading)`;
}
