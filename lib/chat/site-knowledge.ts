import type { UserCategory } from "@/data/vaccines";
import { getTravelerVaccinationsOfficeCharter } from "@/data/traveler-vaccinations-office-charter";
import { formatPortalHref, formatPortalUrl } from "@/lib/chat/portal-url";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { bookingRequestCopy } from "@/lib/i18n/booking-request-copy";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";
import { findDestinationCountry } from "@/lib/chat/destination-country-response";
import {
  countTokenMatches,
  haystackWords,
  tokenizeForKnowledgeSearch,
  tokenMatchesHaystack,
} from "@/lib/chat/search-tokens";
import { effectiveOfficeService } from "@/lib/office-requests/office-traveler-state";
import {
  listDestinationCountriesForPublic,
  listOffices,
  listVaccinesByCategoryForPublic,
} from "@/lib/office-requests/store";
import type { DestinationCountry, Office } from "@/lib/office-requests/types";

export type SiteKnowledgeResultType =
  | "page"
  | "section"
  | "office"
  | "country"
  | "vaccine";

export type SiteKnowledgeEntry = {
  id: string;
  category:
    | "pages"
    | "services"
    | "faq"
    | "policies"
    | "offices"
    | "announcements"
    | "vaccine"
    | "countries";
  title: string;
  body: string;
  path: string;
  tags: string[];
  resultType?: SiteKnowledgeResultType;
  subtitle?: string;
  /** Locale-free path for public site search (e.g. `/international-traveler?country=x#y`). */
  href?: string;
};

export type SiteSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  resultType: SiteKnowledgeResultType;
  category: SiteKnowledgeEntry["category"];
};

export { formatPortalHref, formatPortalUrl } from "@/lib/chat/portal-url";

function pushEntry(
  entries: SiteKnowledgeEntry[],
  entry: Omit<SiteKnowledgeEntry, "tags"> & { tags?: string[] },
) {
  entries.push({
    ...entry,
    tags: entry.tags ?? [],
  });
}

function officeHoursLine(office: Office): string {
  const wh = office.workingHours;
  if (wh?.twentyFourSeven) return "24 hours";
  if (wh?.from && wh?.to) return `${wh.from}–${wh.to}`;
  return "";
}

function officePageSegment(office: Office): string {
  const service = effectiveOfficeService(office);
  if (service === "hajj_umrah_only") return "hajj-umrah";
  if (service === "hajj_umrah_travelers") return "international-traveler";
  return "";
}

function officeHref(office: Office): string {
  const segment = officePageSegment(office);
  return formatPortalHref(segment, { hash: `office-${office.id}` });
}

function inferResultType(
  entry: SiteKnowledgeEntry,
): SiteKnowledgeResultType {
  if (entry.resultType) return entry.resultType;
  if (entry.category === "offices") return "office";
  if (entry.category === "countries") return "country";
  if (entry.category === "vaccine") return "vaccine";
  return "page";
}

export function toSiteSearchResult(entry: SiteKnowledgeEntry): SiteSearchResult {
  const resultType = inferResultType(entry);
  let href = entry.href;
  if (!href) {
    const pathWithoutLocale = entry.path.replace(/^\/[^/]+/, "") || "/";
    href = pathWithoutLocale;
  }
  return {
    id: entry.id,
    title: entry.title,
    subtitle: entry.subtitle ?? entry.body.slice(0, 120),
    href,
    resultType,
    category: entry.category,
  };
}

function trimRequirementsPreview(text: string, maxLen = 120): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

export function countrySiteSearchResult(
  country: DestinationCountry,
): SiteSearchResult {
  return {
    id: `country-${country.id}`,
    title: country.nameAr,
    subtitle: trimRequirementsPreview(country.requirementsAr),
    href: formatPortalHref("international-traveler", {
      query: { country: country.id },
      hash: "destination-country-requirements",
    }),
    resultType: "country",
    category: "countries",
  };
}

/** Promote a fuzzy country match to the top of public site search results. */
export function boostCountrySiteSearchResults(
  query: string,
  countries: DestinationCountry[],
  results: SiteSearchResult[],
  limit: number,
): SiteSearchResult[] {
  const match = findDestinationCountry(query, countries);
  if (!match) {
    return results.slice(0, limit);
  }

  const countryResult = countrySiteSearchResult(match);
  const rest = results.filter((r) => r.id !== countryResult.id);
  return [countryResult, ...rest].slice(0, limit);
}

export function sectionCountryRequirementsHref(query: string): string {
  return formatPortalHref("international-traveler", {
    query: { q: query },
    hash: "destination-country-requirements",
  });
}

export async function buildSiteKnowledgeIndex(
  localeValue: string | undefined,
): Promise<SiteKnowledgeEntry[]> {
  const locale = (localeValue && isLocale(localeValue)
    ? localeValue
    : defaultLocale) as Locale;
  const m = getMessages(locale);
  const charter = getTravelerVaccinationsOfficeCharter(locale);
  const [offices, vaccinesByCategory, destinationCountries] = await Promise.all([
    listOffices(),
    listVaccinesByCategoryForPublic(),
    listDestinationCountriesForPublic(),
  ]);
  const bookingCopy =
    bookingRequestCopy[locale as keyof typeof bookingRequestCopy] ??
    bookingRequestCopy.ar;
  const entries: SiteKnowledgeEntry[] = [];

  pushEntry(entries, {
    id: "home",
    category: "pages",
    resultType: "page",
    title: m.meta.siteName,
    body: `${m.hero.title}. ${m.hero.vision}. ${m.hero.mission}`,
    path: formatPortalUrl(locale),
    href: "/",
    tags: ["رئيسيه", "home", "hero"],
  });

  pushEntry(entries, {
    id: "booking",
    category: "pages",
    resultType: "page",
    title: m.nav.bookVaccination,
    body: "حجز موعد تطعيم أو تقديم شكوى أو مقترح عبر النموذج الإلكتروني.",
    path: formatPortalUrl(locale, "booking"),
    href: "/booking",
    tags: ["حجز", "booking", "موعد", "شكوى"],
  });

  pushEntry(entries, {
    id: "complaint",
    category: "pages",
    resultType: "page",
    title: m.bottomNav.complaints,
    body: "تقديم شكوى أو اقتراح لإدارة الحجر الصحي.",
    path: formatPortalUrl(locale, "complaint"),
    href: "/complaint",
    tags: ["شكوى", "complaint", "اقتراح"],
  });

  const intl = m.pages.international;
  pushEntry(entries, {
    id: "international",
    category: "pages",
    resultType: "page",
    title: intl.heading,
    body: `${intl.description} ${intl.beforeTravel}: ${intl.bullets.join(" | ")}`,
    path: formatPortalUrl(locale, "international-traveler"),
    href: "/international-traveler",
    tags: ["دولي", "international", "مسافر"],
  });

  pushEntry(entries, {
    id: "destination-country-requirements",
    category: "countries",
    resultType: "section",
    title: intl.countryRequirements.requirementsHeading,
    subtitle: intl.destinationVaccinesIntro,
    body: intl.destinationVaccinesIntro,
    path: `${formatPortalUrl(locale, "international-traveler")}#destination-country-requirements`,
    href: formatPortalHref("international-traveler", {
      hash: "destination-country-requirements",
    }),
    tags: [
      "دوله",
      "دولة",
      "طعوم",
      "country",
      "vaccination",
      "requirements",
      normalizeArabic(intl.destinationVaccinesIntro),
    ],
  });

  const hajj = m.pages.hajj;
  pushEntry(entries, {
    id: "hajj-umrah",
    category: "pages",
    resultType: "page",
    title: hajj.heading,
    body: `${hajj.description} ${hajj.basicsTitle}: ${hajj.basicsBody} وثائق: ${hajj.documentBullets.join("، ")}`,
    path: formatPortalUrl(locale, "hajj-umrah"),
    href: "/hajj-umrah",
    tags: ["حج", "عمره", "hajj", "umrah"],
  });

  pushEntry(entries, {
    id: "hajj-vaccination-guide",
    category: "pages",
    resultType: "section",
    title: m.healthGuides.vaccination.title,
    body: m.healthGuides.vaccination.subtitle,
    path: `${formatPortalUrl(locale, "hajj-umrah")}#vaccination-guide`,
    href: formatPortalHref("hajj-umrah", { hash: "vaccination-guide" }),
    tags: ["حج", "عمره", "تطعيم", "دليل", "vaccination", "guide"],
  });

  pushEntry(entries, {
    id: "cairo-traveler-offices",
    category: "offices",
    resultType: "section",
    title: m.hajjTable.heading,
    subtitle: m.hajjTable.intro,
    body: m.hajjTable.intro,
    path: `${formatPortalUrl(locale)}#cairo-traveler-offices-heading`,
    href: formatPortalHref("", { hash: "cairo-traveler-offices-heading" }),
    tags: ["مكاتب", "مكتب", "office", "offices", "عناوين", "مواقع"],
  });

  const citizen = m.pages.citizen;
  pushEntry(entries, {
    id: "citizen",
    category: "pages",
    resultType: "page",
    title: citizen.heading,
    body: `${citizen.description} ${citizen.vaccineBody} ${citizen.docsTitle}: ${citizen.docsBullets.join("، ")}`,
    path: formatPortalUrl(locale, "citizen-services"),
    href: "/citizen-services",
    tags: ["مواطن", "citizen"],
  });

  pushEntry(entries, {
    id: "charter",
    category: "policies",
    resultType: "page",
    title: charter.title,
    body: `${charter.introduction.body} ${charter.complaints.intro} ${charter.workingHours.note}`,
    path: formatPortalUrl(locale, "charter"),
    href: "/charter",
    tags: ["ميثاق", "charter", "سياسه", "شكوى"],
  });

  const charterSections = [
    charter.vision,
    charter.mission,
    charter.rights,
    charter.duties,
    charter.complaints,
    charter.workingHours,
  ] as const;

  for (const section of charterSections) {
    const heading = "heading" in section ? section.heading : charter.workingHours.heading;
    const bodyParts: string[] = [];
    if ("text" in section && section.text) bodyParts.push(section.text);
    if ("intro" in section && section.intro) bodyParts.push(section.intro);
    if ("items" in section && section.items) bodyParts.push(section.items.join("، "));
    if ("channels" in section && section.channels)
      bodyParts.push(section.channels.join("، "));
    if ("note" in section && section.note) bodyParts.push(section.note);
    pushEntry(entries, {
      id: `charter-${normalizeArabic(heading).slice(0, 20)}`,
      category: "policies",
      resultType: "section",
      title: `${charter.title} — ${heading}`,
      body: bodyParts.join(" "),
      path: formatPortalUrl(locale, "charter"),
      href: "/charter",
      tags: ["ميثاق", normalizeArabic(heading)],
    });
  }

  pushEntry(entries, {
    id: "booking-fields",
    category: "pages",
    resultType: "page",
    title: bookingCopy.bookingTitle,
    body: `${bookingCopy.bookingIntro} ${bookingCopy.travelerState} ${bookingCopy.officeName} ${bookingCopy.preferredDate} ${bookingCopy.name} ${bookingCopy.phone}`,
    path: formatPortalUrl(locale, "booking"),
    href: "/booking",
    tags: ["حجز", "نموذج", "booking", "form"],
  });

  for (const bullet of intl.bullets) {
    pushEntry(entries, {
      id: `intl-bullet-${normalizeArabic(bullet).slice(0, 16)}`,
      category: "pages",
      resultType: "section",
      title: intl.heading,
      body: bullet,
      path: formatPortalUrl(locale, "international-traveler"),
      href: "/international-traveler",
      tags: ["دولي", normalizeArabic(bullet)],
    });
  }

  for (const bullet of citizen.docsBullets) {
    pushEntry(entries, {
      id: `citizen-doc-${normalizeArabic(bullet).slice(0, 16)}`,
      category: "pages",
      resultType: "section",
      title: citizen.docsTitle,
      body: bullet,
      path: formatPortalUrl(locale, "citizen-services"),
      href: "/citizen-services",
      tags: ["مواطن", "مستندات", normalizeArabic(bullet)],
    });
  }

  for (const country of destinationCountries) {
    const displayName = `${country.nameEn} - ${country.nameAr}`;
    pushEntry(entries, {
      id: `country-${country.id}`,
      category: "countries",
      resultType: "country",
      title: country.nameAr,
      subtitle: trimRequirementsPreview(country.requirementsAr),
      body: `${displayName}. ${country.requirementsAr.slice(0, 200)}`,
      path: `${formatPortalUrl(locale, "international-traveler")}?country=${encodeURIComponent(country.id)}#destination-country-requirements`,
      href: formatPortalHref("international-traveler", {
        query: { country: country.id },
        hash: "destination-country-requirements",
      }),
      tags: [
        normalizeArabic(country.nameAr),
        normalizeArabic(country.nameEn),
        "دوله",
        "دولة",
        "country",
        "طعوم",
        "تطعيم",
      ],
    });
  }

  const categoryLabels: Record<UserCategory, string> = {
    international: intl.heading,
    hajj: hajj.heading,
    umrah: hajj.heading,
    citizen: citizen.heading,
  };

  for (const category of Object.keys(vaccinesByCategory) as UserCategory[]) {
    for (const vaccine of vaccinesByCategory[category]) {
      const pricePart =
        vaccine.free
          ? "مجاناً"
          : vaccine.priceEgp != null
            ? `${vaccine.priceEgp} جنيه`
            : "—";
      const vaccineSegment =
        category === "international"
          ? "international-traveler"
          : category === "citizen"
            ? "citizen-services"
            : "hajj-umrah";
      pushEntry(entries, {
        id: `vaccine-${vaccine.id}`,
        category: "vaccine",
        resultType: "vaccine",
        title: vaccine.nameAr,
        subtitle: categoryLabels[category],
        body: `${vaccine.nameAr} — ${categoryLabels[category]} — ${pricePart}`,
        path: formatPortalUrl(locale, vaccineSegment),
        href: formatPortalHref(vaccineSegment, {
          hash: "vaccine-selector-heading",
        }),
        tags: [
          normalizeArabic(vaccine.nameAr),
          category,
          "لقاح",
          "سعر",
          "تطعيم",
        ],
      });
    }
  }

  pushEntry(entries, {
    id: "services",
    category: "services",
    resultType: "section",
    title: m.services.heading,
    body: `${m.services.intro} ${m.services.internationalTitle}: ${m.services.internationalDesc} ${m.services.hajjTitle}: ${m.services.hajjDesc} ${m.services.citizenTitle}: ${m.services.citizenDesc}`,
    path: formatPortalUrl(locale),
    href: "/#services-heading",
    tags: ["خدمات", "services"],
  });

  for (const item of m.healthGuides.generalTips.items) {
    pushEntry(entries, {
      id: `faq-${normalizeArabic(item.title).slice(0, 24)}`,
      category: "faq",
      resultType: "section",
      title: item.title,
      body: item.body,
      path: formatPortalUrl(locale),
      href: "/",
      tags: ["اسئله", "faq", normalizeArabic(item.title)],
    });
  }

  for (const section of m.healthGuides.vaccination.sections) {
    for (const item of section.items) {
      pushEntry(entries, {
        id: `faq-vax-${normalizeArabic(item.body).slice(0, 20)}`,
        category: "faq",
        resultType: "section",
        title: section.heading,
        body: item.body,
        path: formatPortalUrl(locale, "hajj-umrah"),
        href: formatPortalHref("hajj-umrah", { hash: "vaccination-guide" }),
        tags: ["تطعيم", "لقاح", "vaccine", "faq"],
      });
    }
  }

  pushEntry(entries, {
    id: "announcement-hajj-basics",
    category: "announcements",
    resultType: "section",
    title: hajj.basicsTitle,
    body: hajj.basicsBody,
    path: formatPortalUrl(locale, "hajj-umrah"),
    href: "/hajj-umrah",
    tags: ["اعلان", "تطعيم", "موسم"],
  });

  pushEntry(entries, {
    id: "footer-contact",
    category: "pages",
    resultType: "section",
    title: m.footer.contactTitle,
    body: `${m.footer.hotline} ${m.footer.email} ${m.footer.address}`,
    path: formatPortalUrl(locale),
    href: "/",
    tags: ["تواصل", "هاتف", "عنوان"],
  });

  for (const office of offices) {
    const hours = officeHoursLine(office);
    const href = officeHref(office);
    pushEntry(entries, {
      id: `office-${office.id}`,
      category: "offices",
      resultType: "office",
      title: office.nameAr,
      subtitle: office.addressAr,
      body: `${office.addressAr}${office.phone ? ` — ${office.phone}` : ""}${hours ? ` — ${hours}` : ""}`,
      path: `${formatPortalUrl(locale, officePageSegment(office))}#office-${office.id}`,
      href,
      tags: [
        normalizeArabic(office.nameAr),
        normalizeArabic(office.addressAr),
        normalizeArabic(office.administrationAr),
        "مكتب",
        "office",
      ],
    });
  }

  return entries;
}

export function searchSiteKnowledge(
  query: string,
  entries: SiteKnowledgeEntry[],
  limit = 5,
): SiteKnowledgeEntry[] {
  const tokens = tokenizeForKnowledgeSearch(query);
  if (tokens.length === 0) return [];

  const scored = entries
    .map((entry) => {
      const haystack = normalizeArabic(
        `${entry.title} ${entry.subtitle ?? ""} ${entry.body} ${entry.tags.join(" ")} ${entry.category}`,
      );
      const words = haystackWords(haystack);
      let score = 0;
      for (const token of tokens) {
        if (tokenMatchesHaystack(token, words)) score += 2;
      }
      if (entry.category === "faq" && tokens.some((t) => t.includes("سؤال"))) {
        score += 1;
      }
      if (entry.category === "countries" && entry.resultType === "country") {
        score += 1;
      }
      if (entry.category === "offices" && entry.resultType === "office") {
        score += 1;
      }
      return { entry, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((row) => row.entry);
}

export function isWeakSearchResult(
  query: string,
  hits: SiteKnowledgeEntry[],
): boolean {
  if (hits.length === 0) return true;
  const tokens = tokenizeForKnowledgeSearch(query);
  if (tokens.length === 0) return true;

  const top = hits[0];
  const words = haystackWords(normalizeArabic(`${top.title} ${top.body}`));
  const matched = countTokenMatches(tokens, words);
  return matched < Math.min(2, tokens.length);
}

export function buildSiteKnowledgeContext(
  locale: string | undefined,
  hits: SiteKnowledgeEntry[],
): string {
  if (hits.length === 0) {
    return "No matching portal content for this question.";
  }

  return [
    "Portal content excerpts (use only these facts; do not invent):",
    ...hits.map(
      (hit, index) =>
        `${index + 1}. [${hit.category}] ${hit.title}: ${hit.body.slice(0, 280)} Link: ${hit.path}`,
    ),
  ].join("\n");
}
