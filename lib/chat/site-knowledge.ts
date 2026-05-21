import type { UserCategory } from "@/data/vaccines";
import { getTravelerVaccinationsOfficeCharter } from "@/data/traveler-vaccinations-office-charter";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { bookingRequestCopy } from "@/lib/i18n/booking-request-copy";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeArabic, tokenizeForSearch } from "@/lib/chat/normalize-arabic";
import {
  listOffices,
  listVaccinesByCategoryForPublic,
} from "@/lib/office-requests/store";
import type { Office } from "@/lib/office-requests/types";

export type SiteKnowledgeEntry = {
  id: string;
  category:
    | "pages"
    | "services"
    | "faq"
    | "policies"
    | "offices"
    | "announcements"
    | "vaccine";
  title: string;
  body: string;
  path: string;
  tags: string[];
};

export function formatPortalUrl(locale: string, path = ""): string {
  const loc = isLocale(locale) ? locale : defaultLocale;
  const segment = path.replace(/^\/+/, "");
  return segment ? `/${loc}/${segment}` : `/${loc}`;
}

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

export async function buildSiteKnowledgeIndex(
  localeValue: string | undefined,
): Promise<SiteKnowledgeEntry[]> {
  const locale = (localeValue && isLocale(localeValue)
    ? localeValue
    : defaultLocale) as Locale;
  const m = getMessages(locale);
  const charter = getTravelerVaccinationsOfficeCharter(locale);
  const [offices, vaccinesByCategory] = await Promise.all([
    listOffices(),
    listVaccinesByCategoryForPublic(),
  ]);
  const bookingCopy =
    bookingRequestCopy[locale as keyof typeof bookingRequestCopy] ??
    bookingRequestCopy.ar;
  const entries: SiteKnowledgeEntry[] = [];

  pushEntry(entries, {
    id: "home",
    category: "pages",
    title: m.meta.siteName,
    body: `${m.hero.title}. ${m.hero.vision}. ${m.hero.mission}`,
    path: formatPortalUrl(locale),
    tags: ["رئيسيه", "home", "hero"],
  });

  pushEntry(entries, {
    id: "booking",
    category: "pages",
    title: m.nav.bookVaccination,
    body: "حجز موعد تطعيم أو تقديم شكوى أو مقترح عبر النموذج الإلكتروني.",
    path: formatPortalUrl(locale, "booking"),
    tags: ["حجز", "booking", "موعد", "شكوى"],
  });

  pushEntry(entries, {
    id: "checkin",
    category: "pages",
    title: "تسجيل الحضور",
    body: "تسجيل حضور في المكتب أو استعادة تذكرة الطابور.",
    path: formatPortalUrl(locale, "checkin"),
    tags: ["حضور", "checkin", "طابور"],
  });

  pushEntry(entries, {
    id: "my-requests",
    category: "pages",
    title: m.nav.myRequests,
    body: "متابعة حالة الطلبات المحفوظة محلياً.",
    path: formatPortalUrl(locale, "my-requests"),
    tags: ["طلباتي", "requests", "status"],
  });

  const intl = m.pages.international;
  pushEntry(entries, {
    id: "international",
    category: "pages",
    title: intl.heading,
    body: `${intl.description} ${intl.beforeTravel}: ${intl.bullets.join(" | ")}`,
    path: formatPortalUrl(locale, "international-traveler"),
    tags: ["دولي", "international", "مسافر"],
  });

  const hajj = m.pages.hajj;
  pushEntry(entries, {
    id: "hajj-umrah",
    category: "pages",
    title: hajj.heading,
    body: `${hajj.description} ${hajj.basicsTitle}: ${hajj.basicsBody} وثائق: ${hajj.documentBullets.join("، ")}`,
    path: formatPortalUrl(locale, "hajj-umrah"),
    tags: ["حج", "عمره", "hajj", "umrah"],
  });

  const citizen = m.pages.citizen;
  pushEntry(entries, {
    id: "citizen",
    category: "pages",
    title: citizen.heading,
    body: `${citizen.description} ${citizen.vaccineBody} ${citizen.docsTitle}: ${citizen.docsBullets.join("، ")}`,
    path: formatPortalUrl(locale, "citizen-services"),
    tags: ["مواطن", "citizen"],
  });

  pushEntry(entries, {
    id: "charter",
    category: "policies",
    title: charter.title,
    body: `${charter.introduction.body} ${charter.complaints.intro} ${charter.workingHours.note}`,
    path: formatPortalUrl(locale, "charter"),
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
      title: `${charter.title} — ${heading}`,
      body: bodyParts.join(" "),
      path: formatPortalUrl(locale, "charter"),
      tags: ["ميثاق", normalizeArabic(heading)],
    });
  }

  pushEntry(entries, {
    id: "booking-fields",
    category: "pages",
    title: bookingCopy.bookingTitle,
    body: `${bookingCopy.bookingIntro} ${bookingCopy.travelerState} ${bookingCopy.officeName} ${bookingCopy.preferredDate} ${bookingCopy.name} ${bookingCopy.phone}`,
    path: formatPortalUrl(locale, "booking"),
    tags: ["حجز", "نموذج", "booking", "form"],
  });

  for (const bullet of intl.bullets) {
    pushEntry(entries, {
      id: `intl-bullet-${normalizeArabic(bullet).slice(0, 16)}`,
      category: "pages",
      title: intl.heading,
      body: bullet,
      path: formatPortalUrl(locale, "international-traveler"),
      tags: ["دولي", normalizeArabic(bullet)],
    });
  }

  for (const bullet of citizen.docsBullets) {
    pushEntry(entries, {
      id: `citizen-doc-${normalizeArabic(bullet).slice(0, 16)}`,
      category: "pages",
      title: citizen.docsTitle,
      body: bullet,
      path: formatPortalUrl(locale, "citizen-services"),
      tags: ["مواطن", "مستندات", normalizeArabic(bullet)],
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
      pushEntry(entries, {
        id: `vaccine-${vaccine.id}`,
        category: "vaccine",
        title: vaccine.nameAr,
        body: `${vaccine.nameAr} — ${categoryLabels[category]} — ${pricePart}`,
        path:
          category === "international"
            ? formatPortalUrl(locale, "international-traveler")
            : category === "citizen"
              ? formatPortalUrl(locale, "citizen-services")
              : formatPortalUrl(locale, "hajj-umrah"),
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
    title: m.services.heading,
    body: `${m.services.intro} ${m.services.internationalTitle}: ${m.services.internationalDesc} ${m.services.hajjTitle}: ${m.services.hajjDesc} ${m.services.citizenTitle}: ${m.services.citizenDesc}`,
    path: formatPortalUrl(locale),
    tags: ["خدمات", "services"],
  });

  for (const item of m.healthGuides.generalTips.items) {
    pushEntry(entries, {
      id: `faq-${normalizeArabic(item.title).slice(0, 24)}`,
      category: "faq",
      title: item.title,
      body: item.body,
      path: formatPortalUrl(locale),
      tags: ["اسئله", "faq", normalizeArabic(item.title)],
    });
  }

  for (const section of m.healthGuides.vaccination.sections) {
    for (const item of section.items) {
      pushEntry(entries, {
        id: `faq-vax-${normalizeArabic(item.body).slice(0, 20)}`,
        category: "faq",
        title: section.heading,
        body: item.body,
        path: formatPortalUrl(locale, "hajj-umrah"),
        tags: ["تطعيم", "لقاح", "vaccine", "faq"],
      });
    }
  }

  pushEntry(entries, {
    id: "announcement-hajj-basics",
    category: "announcements",
    title: hajj.basicsTitle,
    body: hajj.basicsBody,
    path: formatPortalUrl(locale, "hajj-umrah"),
    tags: ["اعلان", "تطعيم", "موسم"],
  });

  pushEntry(entries, {
    id: "footer-contact",
    category: "pages",
    title: m.footer.contactTitle,
    body: `${m.footer.hotline} ${m.footer.email} ${m.footer.address}`,
    path: formatPortalUrl(locale),
    tags: ["تواصل", "هاتف", "عنوان"],
  });

  for (const office of offices) {
    const hours = officeHoursLine(office);
    pushEntry(entries, {
      id: `office-${office.id}`,
      category: "offices",
      title: office.nameAr,
      body: `${office.addressAr}${office.phone ? ` — ${office.phone}` : ""}${hours ? ` — ${hours}` : ""}`,
      path: `${formatPortalUrl(locale)}#locations-heading`,
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
  const tokens = tokenizeForSearch(query);
  if (tokens.length === 0) return [];

  const scored = entries
    .map((entry) => {
      const haystack = normalizeArabic(
        `${entry.title} ${entry.body} ${entry.tags.join(" ")} ${entry.category}`,
      );
      let score = 0;
      for (const token of tokens) {
        if (haystack.includes(token)) score += 2;
      }
      if (entry.category === "faq" && tokens.some((t) => t.includes("سؤال"))) {
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
  const tokens = tokenizeForSearch(query);
  if (tokens.length === 0) return true;

  const top = hits[0];
  const haystack = normalizeArabic(`${top.title} ${top.body}`);
  const matched = tokens.filter((t) => haystack.includes(t)).length;
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
