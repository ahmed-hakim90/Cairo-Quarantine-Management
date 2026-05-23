import { normalizeArabic } from "@/lib/chat/normalize-arabic";
import { findDestinationCountry } from "@/lib/chat/destination-country-response";
import {
  getChatOfficeAreaTokens,
  getChatOfficeNameTokens,
  messageMatchesChatOfficeCatalog,
} from "@/lib/chat/office-catalog";
import {
  BOOKING_PATTERNS,
  CHECKIN_PATTERNS,
  COMPLAINT_PATTERNS,
  DESTINATION_PATTERNS,
  HOURS_PATTERNS,
  INTERNATIONAL_INFO_PATTERNS,
  normalizedIncludesAny,
  OFFICE_LOCATION_PATTERNS,
  PRICE_PATTERNS,
} from "@/lib/chat/synonym-patterns";
import type { DestinationCountry } from "@/lib/office-requests/types";

export type ChatIntent =
  | "price"
  | "booking"
  | "office_hours"
  | "services"
  | "destination_vaccines"
  | "office"
  | "hajj_umrah"
  | "checkin_info"
  | "complaint_info"
  | "international_info"
  | "general";

export function isPriceQuestion(normalized: string): boolean {
  if (normalizedIncludesAny(normalized, PRICE_PATTERNS)) return true;
  const tokens = normalized.split(" ").filter((t) => t.length >= 2);
  return tokens.some((t) => t === "كام");
}

export function isBookingQuestion(normalized: string): boolean {
  if (normalizedIncludesAny(normalized, BOOKING_PATTERNS)) return true;
  const tokens = normalized.split(" ").filter((t) => t.length >= 2);
  return tokens.some((t) => t === "موعد");
}

const QUESTION_STOP_TOKENS = new Set([
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

function hasDestinationSignal(normalized: string): boolean {
  return normalizedIncludesAny(normalized, DESTINATION_PATTERNS);
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
  return normalizedIncludesAny(normalized, OFFICE_LOCATION_PATTERNS);
}

function hasHoursSignal(normalized: string): boolean {
  return normalizedIncludesAny(normalized, HOURS_PATTERNS);
}

export function isCheckinInfoQuestion(normalized: string): boolean {
  if (!normalized) return false;
  if (isBookingQuestion(normalized)) return false;
  return normalizedIncludesAny(normalized, CHECKIN_PATTERNS);
}

export function isComplaintInfoQuestion(normalized: string): boolean {
  if (!normalized) return false;
  return normalizedIncludesAny(normalized, COMPLAINT_PATTERNS);
}

export function isInternationalInfoQuestion(
  normalized: string,
  countries: DestinationCountry[],
): boolean {
  if (!normalized) return false;
  if (isPriceQuestion(normalized) || isBookingQuestion(normalized)) return false;
  if (findDestinationCountry(normalized, countries) && hasDestinationSignal(normalized)) {
    return false;
  }
  if (normalizedIncludesAny(normalized, INTERNATIONAL_INFO_PATTERNS)) return true;
  return (
    (normalized.includes("دولي") || normalized.includes("international")) &&
    (normalized.includes("مسافر") ||
      normalized.includes("سفر") ||
      normalized.includes("مطلوب") ||
      normalized.includes("ايه") ||
      normalized.includes("what"))
  );
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
  if (isInternationalInfoQuestion(normalized, countries)) return false;

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
  if (isCheckinInfoQuestion(normalized) || isComplaintInfoQuestion(normalized)) {
    return false;
  }

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
  if (isCheckinInfoQuestion(normalized)) return "checkin_info";
  if (isComplaintInfoQuestion(normalized)) return "complaint_info";
  if (isInternationalInfoQuestion(normalized, countries)) {
    return "international_info";
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

export function resolveIntentWithContext(
  message: string,
  options?: {
    destinationCountries?: DestinationCountry[];
    carriedIntent?: ChatIntent;
  },
): ChatIntent {
  const intent = classifyChatIntent(message, {
    destinationCountries: options?.destinationCountries,
  });
  const carried = options?.carriedIntent;
  if (!carried || carried === "general") return intent;
  if (intent !== "general") return intent;

  const carriedStillValid: ChatIntent[] = [
    "office",
    "office_hours",
    "price",
    "destination_vaccines",
    "booking",
    "hajj_umrah",
    "services",
    "checkin_info",
    "complaint_info",
    "international_info",
  ];
  if (carriedStillValid.includes(carried)) return carried;
  return intent;
}
