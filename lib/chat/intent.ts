import { normalizeArabic } from "@/lib/chat/normalize-arabic";
import { findDestinationCountry } from "@/lib/chat/destination-country-response";
import {
  getChatOfficeAreaTokens,
  getChatOfficeNameTokens,
  messageMatchesChatOfficeCatalog,
} from "@/lib/chat/office-catalog";
import type { DestinationCountry } from "@/lib/office-requests/types";

export type ChatIntent =
  | "price"
  | "booking"
  | "office_hours"
  | "services"
  | "destination_vaccines"
  | "office"
  | "hajj_umrah"
  | "general";

export function isPriceQuestion(normalized: string): boolean {
  return (
    normalized.includes("تكلف") ||
    normalized.includes("سعر") ||
    normalized.includes("بكم") ||
    normalized.includes("بكام") ||
    normalized.includes("كام") ||
    normalized.includes("جنيه") ||
    normalized.includes("egp") ||
    normalized.includes("مصاريف") ||
    normalized.includes("price") ||
    normalized.includes("cost")
  );
}

export function isBookingQuestion(normalized: string): boolean {
  const tokens = normalized.split(" ").filter((t) => t.length >= 2);
  return (
    normalized.includes("حجز") ||
    tokens.some((t) => t === "موعد") ||
    normalized.includes("booking") ||
    normalized.includes("appointment")
  );
}

const HOURS_SIGNALS = [
  "مواعيد",
  "دوام",
  "شغل",
  "مفتوح",
  "ساعات",
  "working",
  "hours",
  "open",
];

const QUESTION_STOP_TOKENS = new Set([
  "ايه",
  "ايه",
  "هي",
  "هو",
  "هم",
  "التي",
  "الذي",
  "تعليمات",
  "الخدمات",
  "خدمات",
]);

const BLOCKED_AREA_SUBSTRINGS = new Set([
  "مصر",
  "نصر",
  "طفل",
  "رعايه",
  "تطعيم",
  "مطار",
  "مسافر",
  "سافر",
  "دولي",
  "دوله",
  "خدمات",
]);

const DESTINATION_SIGNALS = [
  "مسافر",
  "سافر",
  "دوله",
  "لقاح",
  "تطعيم",
  "هتطعم",
  "هاخد",
  "محتاج",
  "متطلب",
  "شهاده",
  "فاكسين",
  "vaccine",
  "travel",
  "متطلبات",
];

function hasDestinationSignal(normalized: string): boolean {
  return DESTINATION_SIGNALS.some((signal) => normalized.includes(signal));
}

function mentionsHajjOrUmrah(normalized: string): boolean {
  return (
    normalized.includes("عمره") ||
    normalized.includes("معتم") ||
    normalized.includes("حج") ||
    normalized.includes("حاج")
  );
}

function isExplicitOfficeQuery(normalized: string): boolean {
  return (
    normalized.includes("اقرب") ||
    normalized.includes("مكتب") ||
    normalized.includes("مكاتب") ||
    normalized.includes("عنوان") ||
    normalized.includes("office") ||
    normalized.includes("location")
  );
}

function hasHoursSignal(normalized: string): boolean {
  return HOURS_SIGNALS.some((signal) => normalized.includes(signal));
}

/** Office or area named in the message (for hours/location routing). */
export function hasOfficeLocationContext(
  normalized: string,
  options?: { destinationCountries?: DestinationCountry[] },
): boolean {
  if (!normalized) return false;
  if (isExplicitOfficeQuery(normalized)) return true;

  const countries = options?.destinationCountries ?? [];
  if (
    findDestinationCountry(normalized, countries) &&
    hasDestinationSignal(normalized)
  ) {
    return false;
  }

  const tokens = normalized
    .split(" ")
    .filter((t) => t.length >= 3 && !QUESTION_STOP_TOKENS.has(t));
  if (tokens.length === 0 || tokens.length > 5) return false;

  if (matchesOfficeNameInMessage(normalized)) return true;

  const areaTokens = getChatOfficeAreaTokens();
  return tokens.some((token) =>
    areaTokens.some((area) => areaMatchesToken(area, token)),
  );
}

export function isOfficeHoursQuestion(
  normalized: string,
  options?: { destinationCountries?: DestinationCountry[] },
): boolean {
  if (!normalized || !hasHoursSignal(normalized)) return false;
  if (isPriceQuestion(normalized) || isBookingQuestion(normalized)) return false;
  return hasOfficeLocationContext(normalized, options);
}

function isServicesQuestion(normalized: string): boolean {
  if (!normalized.includes("خدمات") && !normalized.includes("services")) {
    return false;
  }
  return !isExplicitOfficeQuery(normalized);
}

function areaMatchesToken(area: string, token: string): boolean {
  if (QUESTION_STOP_TOKENS.has(token)) return false;
  if (token === area) return true;
  if (BLOCKED_AREA_SUBSTRINGS.has(area) || BLOCKED_AREA_SUBSTRINGS.has(token)) {
    return false;
  }
  if (token.length < 4 || area.length < 4) return false;
  return area.includes(token) || token.includes(area);
}

function matchesOfficeNameInMessage(normalized: string): boolean {
  if (messageMatchesChatOfficeCatalog(normalized)) return true;

  const tokens = normalized
    .split(" ")
    .filter((t) => t.length >= 4 && !QUESTION_STOP_TOKENS.has(t));
  const nameTokens = getChatOfficeNameTokens();
  return tokens.some((token) =>
    nameTokens.some((name) => areaMatchesToken(name, token)),
  );
}

export function isDestinationVaccineQuestion(
  normalized: string,
  countries: DestinationCountry[],
): boolean {
  if (!normalized || countries.length === 0) return false;
  if (isPriceQuestion(normalized) || isBookingQuestion(normalized)) return false;
  if (isExplicitOfficeQuery(normalized)) return false;

  const country = findDestinationCountry(normalized, countries);
  if (!country) return false;

  return (
    hasDestinationSignal(normalized) ||
    normalized.includes("ايه") ||
    normalized.includes("what") ||
    normalized.includes("which")
  );
}

export function isOfficeOrAreaQuery(
  normalized: string,
  options?: { destinationCountries?: DestinationCountry[] },
): boolean {
  if (!normalized) return false;
  if (isPriceQuestion(normalized) || isBookingQuestion(normalized)) return false;
  if (isServicesQuestion(normalized)) return false;

  const countries = options?.destinationCountries ?? [];
  if (
    findDestinationCountry(normalized, countries) &&
    hasDestinationSignal(normalized)
  ) {
    return false;
  }

  if (mentionsHajjOrUmrah(normalized) && !isExplicitOfficeQuery(normalized)) {
    return false;
  }

  if (isExplicitOfficeQuery(normalized)) return true;
  if (matchesOfficeNameInMessage(normalized)) return true;

  const tokens = normalized
    .split(" ")
    .filter((t) => t.length >= 3 && !QUESTION_STOP_TOKENS.has(t));
  if (tokens.length === 0 || tokens.length > 4) return false;

  const areaTokens = getChatOfficeAreaTokens();
  return tokens.some((token) =>
    areaTokens.some((area) => areaMatchesToken(area, token)),
  );
}

export function classifyChatIntent(
  message: string,
  options?: { destinationCountries?: DestinationCountry[] },
): ChatIntent {
  const normalized = normalizeArabic(message);
  const countries = options?.destinationCountries ?? [];

  if (isPriceQuestion(normalized)) return "price";
  if (isBookingQuestion(normalized)) return "booking";
  if (isOfficeHoursQuestion(normalized, { destinationCountries: countries })) {
    return "office_hours";
  }
  if (isServicesQuestion(normalized)) return "services";
  if (isDestinationVaccineQuestion(normalized, countries)) {
    return "destination_vaccines";
  }
  if (mentionsHajjOrUmrah(normalized) && !isExplicitOfficeQuery(normalized)) {
    return "hajj_umrah";
  }
  if (isOfficeOrAreaQuery(normalized, { destinationCountries: countries })) {
    return "office";
  }
  return "general";
}
