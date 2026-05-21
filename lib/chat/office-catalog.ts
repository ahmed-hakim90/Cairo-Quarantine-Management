import { CAIRO_TRAVELER_VACCINATION_OFFICES } from "@/data/hajj-traveler-offices-cairo";
import { VACCINATION_CENTERS } from "@/data/locations";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";

export type ChatOffice = {
  id: string;
  centerNameAr: string;
  centerNameEn: string;
  centerNameFr: string;
  administrationAr: string;
  administrationEn: string;
  administrationFr: string;
  addressAr: string;
  addressEn: string;
  addressFr: string;
  phone: string;
  mapsUrl?: string;
};

function dedupeKey(office: {
  centerNameAr: string;
  addressAr: string;
}): string {
  return normalizeArabic(`${office.centerNameAr}|${office.addressAr}`).slice(0, 120);
}

function fromVaccinationCenter(
  row: (typeof VACCINATION_CENTERS)[number],
): ChatOffice {
  return {
    id: `loc-${row.id}`,
    centerNameAr: row.centerNameAr,
    centerNameEn: row.centerNameEn,
    centerNameFr: row.centerNameFr,
    administrationAr: row.administrationAr,
    administrationEn: row.administrationEn,
    administrationFr: row.administrationFr,
    addressAr: row.addressAr,
    addressEn: row.addressEn,
    addressFr: row.addressFr,
    phone: row.phone,
    mapsUrl: row.mapsUrl,
  };
}

function fromHajjOffice(
  row: (typeof CAIRO_TRAVELER_VACCINATION_OFFICES)[number],
): ChatOffice {
  return {
    id: row.id,
    centerNameAr: row.officeNameAr,
    centerNameEn: row.officeNameAr,
    centerNameFr: row.officeNameAr,
    administrationAr: row.administrationAr,
    administrationEn: row.administrationAr,
    administrationFr: row.administrationAr,
    addressAr: row.addressAr,
    addressEn: row.addressAr,
    addressFr: row.addressAr,
    phone: row.phone ?? "—",
    mapsUrl: row.mapsUrl,
  };
}

let cachedCatalog: ChatOffice[] | null = null;
let cachedAreaTokens: string[] | null = null;

export function buildChatOfficeCatalog(): ChatOffice[] {
  if (cachedCatalog) return cachedCatalog;

  const seen = new Set<string>();
  const offices: ChatOffice[] = [];

  for (const row of VACCINATION_CENTERS) {
    const office = fromVaccinationCenter(row);
    const key = dedupeKey(office);
    if (seen.has(key)) continue;
    seen.add(key);
    offices.push(office);
  }

  for (const row of CAIRO_TRAVELER_VACCINATION_OFFICES) {
    const office = fromHajjOffice(row);
    const key = dedupeKey(office);
    if (seen.has(key)) continue;
    seen.add(key);
    offices.push(office);
  }

  cachedCatalog = offices;
  return offices;
}

/** Tokens for matching bare area names like «حلوان» or «التجمع». */
export function getChatOfficeAreaTokens(): string[] {
  if (cachedAreaTokens) return cachedAreaTokens;

  const tokens = new Set<string>();
  const extra = [
    "تجمع",
    "حلوان",
    "معادي",
    "نصر",
    "شروق",
    "مطار",
    "helwan",
    "maadi",
    "tagamoa",
    "new cairo",
  ];

  for (const office of buildChatOfficeCatalog()) {
    for (const value of [
      office.administrationAr,
      office.administrationEn,
      office.centerNameAr,
    ]) {
      const normalized = normalizeArabic(value);
      for (const part of normalized.split(" ")) {
        if (part.length >= 3) tokens.add(part);
      }
    }
  }

  for (const item of extra) {
    tokens.add(normalizeArabic(item));
  }

  cachedAreaTokens = [...tokens].filter((t) => t.length >= 3);
  return cachedAreaTokens;
}

export function officeHaystack(office: ChatOffice): string {
  return normalizeArabic(
    [
      office.centerNameAr,
      office.centerNameEn,
      office.administrationAr,
      office.administrationEn,
      office.addressAr,
      office.addressEn,
    ].join(" "),
  );
}
