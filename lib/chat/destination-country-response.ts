import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";
import { formatPortalUrl } from "@/lib/chat/portal-url";
import type { DestinationCountry } from "@/lib/office-requests/types";

function getLocale(localeValue: string | undefined) {
  return localeValue && isLocale(localeValue) ? localeValue : defaultLocale;
}

function trimRequirements(text: string, maxLen: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

/** Match a destination country mentioned in the user message (same idea as the portal picker). */
export function findDestinationCountry(
  message: string,
  countries: DestinationCountry[],
): DestinationCountry | null {
  const normalized = normalizeArabic(message);
  if (!normalized) return null;

  let best: { country: DestinationCountry; score: number } | null = null;

  for (const country of countries) {
    const nameAr = normalizeArabic(country.nameAr);
    const nameEn = normalizeArabic(country.nameEn);

    let score = 0;
    if (nameAr.length >= 3 && normalized.includes(nameAr)) {
      score = nameAr.length;
    } else if (nameEn.length >= 3 && normalized.includes(nameEn)) {
      score = nameEn.length;
    } else {
      for (const part of nameAr.split(" ").filter((p) => p.length >= 4)) {
        if (normalized.includes(part)) score = Math.max(score, part.length);
        else if (part.includes(normalized) && normalized.length >= 3) {
          score = Math.max(score, normalized.length);
        }
      }
      for (const part of nameEn.split(" ").filter((p) => p.length >= 4)) {
        if (normalized.includes(part)) score = Math.max(score, part.length);
        else if (part.includes(normalized) && normalized.length >= 3) {
          score = Math.max(score, normalized.length);
        }
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { country, score };
    }
  }

  return best?.country ?? null;
}

export function buildDestinationCountryResponse(
  localeValue: string | undefined,
  message: string,
  countries: DestinationCountry[],
): string {
  const loc = getLocale(localeValue);
  const path = formatPortalUrl(loc, "international-traveler");
  const country = findDestinationCountry(message, countries);

  if (!country) {
    if (loc === "en") {
      return `Search destination vaccination requirements on the international traveler page.\n[Country requirements](${path})`;
    }
    return `ابحث عن متطلبات التطعيم حسب الدولة من صفحة المسافر الدولي.\n[متطلبات الدول](${path})`;
  }

  const title =
    loc === "en" ? `${country.nameEn} (${country.nameAr})` : country.nameAr;
  const requirements = trimRequirements(country.requirementsAr, 420);

  if (loc === "en") {
    return `Vaccination requirements for ${title}:\n${requirements}\n[All countries](${path})`;
  }
  return `متطلبات التطعيم للسفر إلى ${title}:\n${requirements}\n[كل الدول](${path})`;
}
