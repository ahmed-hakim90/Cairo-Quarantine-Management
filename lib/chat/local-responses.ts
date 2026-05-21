import type { UserCategory, VaccineRecord } from "@/data/vaccines";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";
import { buildDestinationCountryResponse } from "@/lib/chat/destination-country-response";
import { classifyChatIntent } from "@/lib/chat/intent";
import { buildOfficeHoursResponse } from "@/lib/chat/office-hours-response";
import { buildVaccineLocationResponse } from "@/lib/chat/office-vaccine-location";
import { buildOfficeAssistantResponse } from "@/lib/chat/office-response";
import { formatPortalUrl } from "@/lib/chat/site-knowledge";
import {
  searchSiteKnowledge,
  type SiteKnowledgeEntry,
} from "@/lib/chat/site-knowledge";
import { buildVaccinePriceAssistantResponse } from "@/lib/chat/vaccine-price-response";
import type { PortalAssistantResponse } from "@/lib/chat/portal-assistant-types";
import type { DestinationCountry, Office } from "@/lib/office-requests/types";

function getLocale(localeValue: string | undefined) {
  return localeValue && isLocale(localeValue) ? localeValue : defaultLocale;
}

function buildBookingResponse(localeValue: string | undefined): PortalAssistantResponse {
  const loc = getLocale(localeValue);
  const m = getMessages(loc);
  const path = formatPortalUrl(loc, "booking");
  if (loc === "en") {
    return {
      answer: `Book a vaccination appointment from the portal booking page.\n[Open booking](${path})`,
      source: m.nav.bookVaccination,
      type: "booking",
      confidence: 0.95,
    };
  }
  if (loc === "zh") {
    return {
      answer: `请通过门户网站预约页面提交预约。\n[打开预约](${path})`,
      source: m.nav.bookVaccination,
      type: "booking",
      confidence: 0.95,
    };
  }
  if (loc === "fr") {
    return {
      answer: `Prenez rendez-vous via la page de reservation du portail.\n[Ouvrir la reservation](${path})`,
      source: m.nav.bookVaccination,
      type: "booking",
      confidence: 0.95,
    };
  }
  return {
    answer: `يمكنك الحجز من صفحة الحجز في البوابة.\n[فتح صفحة الحجز](${path})`,
    source: m.nav.bookVaccination,
    type: "booking",
    confidence: 0.95,
  };
}

function buildHajjResponse(localeValue: string | undefined): PortalAssistantResponse {
  const loc = getLocale(localeValue);
  const hajj = getMessages(loc).pages.hajj;
  const path = formatPortalUrl(loc, "hajj-umrah");
  const source = loc === "ar" ? "تطعيم الحج والعمرة" : hajj.heading;

  if (loc === "en") {
    return {
      answer: `Hajj/Umrah: ${hajj.basicsBody}\nDocuments: ${hajj.documentBullets.join(", ")}.\n[Full guide](${path})`,
      source,
      type: "vaccine",
      confidence: 0.95,
    };
  }
  return {
    answer: `الحج والعمرة: ${hajj.basicsBody}\nالوثائق: ${hajj.documentBullets.join("، ")}.\n[الدليل الكامل](${path})`,
    source,
    type: "vaccine",
    confidence: 0.95,
  };
}

function buildServicesResponse(
  localeValue: string | undefined,
  knowledgeIndex: SiteKnowledgeEntry[],
): PortalAssistantResponse {
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
    return {
      answer: `${servicesHit.body.slice(0, 280)}\n[${servicesHit.title}](${servicesHit.path || path})`,
      source: servicesHit.title,
      type: "contact",
      confidence: 0.9,
    };
  }

  const answer =
    loc === "en"
      ? `${m.intro}\n${m.internationalTitle}: ${m.internationalDesc}\n${m.hajjTitle}: ${m.hajjDesc}\n[Services](${path})`
      : `${m.intro}\n${m.internationalTitle}: ${m.internationalDesc}\n${m.hajjTitle}: ${m.hajjDesc}\n[الخدمات](${path})`;

  return {
    answer,
    source: m.heading,
    type: "contact",
    confidence: 0.85,
  };
}

function buildSearchHitResponse(
  localeValue: string | undefined,
  hit: SiteKnowledgeEntry,
): PortalAssistantResponse {
  const loc = getLocale(localeValue);
  const type =
    hit.category === "offices"
      ? "office"
      : hit.category === "vaccine"
        ? "vaccine"
        : "contact";

  return {
    answer:
      loc === "en"
        ? `${hit.body.slice(0, 200)}\n[${hit.title}](${hit.path})`
        : `${hit.body.slice(0, 200)}\n[${hit.title}](${hit.path})`,
    source: hit.title,
    type,
    confidence: 0.8,
  };
}

function destinationToPortalResponse(
  locale: string | undefined,
  text: string,
): PortalAssistantResponse {
  const loc = getLocale(locale);
  return {
    answer: text,
    source:
      loc === "ar"
        ? "متطلبات التطعيم للمسافرين"
        : "Destination vaccination requirements",
    type: "vaccine",
    confidence: 0.95,
  };
}

function officeHoursToPortalResponse(
  locale: string | undefined,
  text: string,
): PortalAssistantResponse {
  return {
    answer: text,
    source: getLocale(locale) === "ar" ? "مواعيد العمل" : "Working hours",
    type: "office",
    confidence: 0.95,
  };
}

export function getLocalChatResponse({
  locale,
  message,
  knowledgeIndex,
  destinationCountries = [],
  portalOffices = [],
  vaccinesByCategory,
}: {
  locale: string | undefined;
  message: string;
  knowledgeIndex: SiteKnowledgeEntry[];
  destinationCountries?: DestinationCountry[];
  portalOffices?: Office[];
  vaccinesByCategory: Record<UserCategory, VaccineRecord[]>;
}): PortalAssistantResponse | null {
  const vaccineLocation = buildVaccineLocationResponse(locale, message);
  if (vaccineLocation) return vaccineLocation;

  const intent = classifyChatIntent(message, { destinationCountries });
  const hits = searchSiteKnowledge(message, knowledgeIndex, 5);

  switch (intent) {
    case "price":
      return buildVaccinePriceAssistantResponse(
        locale,
        message,
        vaccinesByCategory,
      );
    case "booking":
      return buildBookingResponse(locale);
    case "office_hours": {
      const hoursText = buildOfficeHoursResponse(
        locale,
        message,
        portalOffices,
      );
      return officeHoursToPortalResponse(locale, hoursText);
    }
    case "services":
      return buildServicesResponse(locale, knowledgeIndex);
    case "destination_vaccines": {
      const destText = buildDestinationCountryResponse(
        locale,
        message,
        destinationCountries,
      );
      return destinationToPortalResponse(locale, destText);
    }
    case "hajj_umrah":
      return buildHajjResponse(locale);
    case "office":
      return buildOfficeAssistantResponse(locale, message, hits);
    case "general":
      if (hits.length > 0) return buildSearchHitResponse(locale, hits[0]);
      return null;
  }
}
