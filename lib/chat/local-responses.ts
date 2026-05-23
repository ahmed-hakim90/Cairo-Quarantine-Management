import type { UserCategory, VaccineRecord } from "@/data/vaccines";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";
import { buildDestinationCountryResponse } from "@/lib/chat/destination-country-response";
import { classifyChatIntent } from "@/lib/chat/intent";
import { buildOfficeHoursResponse } from "@/lib/chat/office-hours-response";
import { buildVaccineLocationResponse } from "@/lib/chat/office-vaccine-location";
import { buildOfficeAssistantResponse } from "@/lib/chat/office-response";
import { bookingRequestCopy } from "@/lib/i18n/booking-request-copy";
import { formatPortalUrl } from "@/lib/chat/site-knowledge";
import {
  isWeakSearchResult,
  searchSiteKnowledge,
  type SiteKnowledgeEntry,
} from "@/lib/chat/site-knowledge";
import { buildVaccinePriceAssistantResponse } from "@/lib/chat/vaccine-price-response";
import type { PortalAssistantResponse } from "@/lib/chat/portal-assistant-types";
import type { DestinationCountry, Office } from "@/lib/office-requests/types";

function getLocale(localeValue: string | undefined) {
  return localeValue && isLocale(localeValue) ? localeValue : defaultLocale;
}

function buildHelpCapabilitiesResponse(
  localeValue: string | undefined,
): PortalAssistantResponse {
  const loc = getLocale(localeValue);
  const m = getMessages(loc);
  const servicesPath = formatPortalUrl(loc);
  const bookingPath = formatPortalUrl(loc, "booking");
  const locationsPath = `${formatPortalUrl(loc)}#locations-heading`;

  if (loc === "en") {
    return {
      answer: `${m.chat.greeting}\n• Services and traveller guides\n• Vaccination booking\n• Office locations and hours\n• Guidance vaccine prices\n[Services](${servicesPath}) [Booking](${bookingPath}) [Offices](${locationsPath})`,
      source: m.chat.title,
      type: "contact",
      confidence: 0.95,
    };
  }
  if (loc === "zh") {
    return {
      answer: `${m.chat.greeting}\n• 服务与旅客指南\n• 疫苗预约\n• 办事处地址与工作时间\n• 疫苗参考价格\n[服务](${servicesPath}) [预约](${bookingPath}) [办事处](${locationsPath})`,
      source: m.chat.title,
      type: "contact",
      confidence: 0.95,
    };
  }
  if (loc === "fr") {
    return {
      answer: `${m.chat.greeting}\n• Services et guides voyageurs\n• Reservation de vaccination\n• Bureaux et horaires\n• Prix indicatifs des vaccins\n[Services](${servicesPath}) [Reservation](${bookingPath}) [Bureaux](${locationsPath})`,
      source: m.chat.title,
      type: "contact",
      confidence: 0.95,
    };
  }
  return {
    answer: `${m.chat.greeting}\n• الخدمات وإرشادات المسافرين\n• حجز التطعيم\n• مواقع المكاتب ومواعيد العمل\n• أسعار اللقاحات التوجيهية\n[الخدمات](${servicesPath}) [الحجز](${bookingPath}) [المكاتب](${locationsPath})`,
    source: m.chat.title,
    type: "contact",
    confidence: 0.95,
  };
}

function buildBookingStepsResponse(
  localeValue: string | undefined,
): PortalAssistantResponse {
  const loc = getLocale(localeValue);
  const m = getMessages(loc);
  const booking =
    bookingRequestCopy[loc as keyof typeof bookingRequestCopy] ??
    bookingRequestCopy.ar;
  const path = formatPortalUrl(loc, "booking");
  const requestsPath = formatPortalUrl(loc, "my-requests");

  if (loc === "en") {
    return {
      answer: `Booking steps:\n1. Open the booking page — ${booking.bookingIntro}\n2. Choose governorate and ${booking.officeName.toLowerCase()}, then ${booking.preferredDate.toLowerCase()}.\n3. Enter ${booking.name.toLowerCase()} and ${booking.phone.toLowerCase()}, then submit.\n4. Track your request from My Requests.\n[Open booking](${path}) [My requests](${requestsPath})`,
      source: m.nav.bookVaccination,
      type: "booking",
      confidence: 0.95,
    };
  }
  if (loc === "zh") {
    return {
      answer: `预约步骤：\n1. 打开预约页面。\n2. 选择旅客状态、省份与办事处及日期。\n3. 填写姓名和电话并提交。\n4. 在“我的请求”中跟踪。\n[打开预约](${path}) [我的请求](${requestsPath})`,
      source: m.nav.bookVaccination,
      type: "booking",
      confidence: 0.95,
    };
  }
  if (loc === "fr") {
    return {
      answer: `Etapes de reservation :\n1. Ouvrez la page de reservation.\n2. Choisissez le statut, le bureau et la date.\n3. Saisissez le nom et le telephone, puis envoyez.\n4. Suivez la demande dans Mes demandes.\n[Reservation](${path}) [Mes demandes](${requestsPath})`,
      source: m.nav.bookVaccination,
      type: "booking",
      confidence: 0.95,
    };
  }
  return {
    answer: `خطوات الحجز:\n1. افتح صفحة الحجز — ${booking.bookingIntro}\n2. اختر المحافظة و${booking.officeName} و${booking.preferredDate}.\n3. أدخل ${booking.name} و${booking.phone} ثم أرسل الطلب.\n4. تابع الطلب من صفحة طلباتي.\n[فتح صفحة الحجز](${path}) [طلباتي](${requestsPath})`,
    source: m.nav.bookVaccination,
    type: "booking",
    confidence: 0.95,
  };
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
    case "help_capabilities":
      return buildHelpCapabilitiesResponse(locale);
    case "booking_steps":
      return buildBookingStepsResponse(locale);
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
      if (hits.length > 0 && !isWeakSearchResult(message, hits)) {
        return buildSearchHitResponse(locale, hits[0]);
      }
      return null;
  }
}
