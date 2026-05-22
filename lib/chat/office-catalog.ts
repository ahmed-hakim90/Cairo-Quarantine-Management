import { CAIRO_TRAVELER_VACCINATION_OFFICES } from "@/data/hajj-traveler-offices-cairo";
import { VACCINATION_CENTERS } from "@/data/locations";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";

/** Expand region tokens (e.g. تجمع → also match القاهرة الجديدة). */
export const REGION_SYNONYMS: Record<string, string[]> = {
  تجمع: ["تجمع", "القاهره الجديده", "القاهرة الجديدة"],
  حلوان: ["حلوان", "حدائق حلوان"],
};

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

/** Collapse spacing/punctuation so locations.ts and hajj file addresses dedupe. */
function normalizeAddressForDedupe(address: string): string {
  let value = normalizeArabic(address);
  value = value.replace(/\s+/g, "");
  value = value.replace(/(\d+)\s*ش/g, "$1ش");
  return value;
}

function dedupeKey(office: {
  centerNameAr: string;
  addressAr: string;
}): string {
  const name = normalizeArabic(office.centerNameAr);
  const address = normalizeAddressForDedupe(office.addressAr);
  return `${name}|${address}`;
}

function mapsDedupeKey(mapsUrl: string | undefined): string | null {
  const url = mapsUrl?.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `map:${parsed.hostname}${parsed.pathname}`;
  } catch {
    return `map:${normalizeArabic(url)}`;
  }
}

function registerDedupeKeys(
  office: ChatOffice,
  seen: Set<string>,
): boolean {
  const keys = [dedupeKey(office)];
  const mapKey = mapsDedupeKey(office.mapsUrl);
  if (mapKey) keys.push(mapKey);
  if (keys.some((key) => seen.has(key))) return false;
  for (const key of keys) seen.add(key);
  return true;
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
let cachedNameTokens: string[] | null = null;

export function buildChatOfficeCatalog(): ChatOffice[] {
  if (cachedCatalog) return cachedCatalog;

  const seen = new Set<string>();
  const offices: ChatOffice[] = [];

  for (const row of VACCINATION_CENTERS) {
    const office = fromVaccinationCenter(row);
    if (!registerDedupeKeys(office, seen)) continue;
    offices.push(office);
  }

  for (const row of CAIRO_TRAVELER_VACCINATION_OFFICES) {
    const office = fromHajjOffice(row);
    if (!registerDedupeKeys(office, seen)) continue;
    offices.push(office);
  }

  cachedCatalog = offices;
  return offices;
}

/** Tokens for matching bare area names like «حلوان» or «التجمع» (administrations + region synonyms only). */
export function getChatOfficeAreaTokens(): string[] {
  if (cachedAreaTokens) return cachedAreaTokens;

  const tokens = new Set<string>();

  for (const office of buildChatOfficeCatalog()) {
    for (const value of [office.administrationAr, office.administrationEn]) {
      const normalized = normalizeArabic(value);
      for (const part of normalized.split(" ")) {
        if (part.length >= 4) tokens.add(part);
      }
      if (normalized.length >= 4) tokens.add(normalized);
    }
  }

  for (const key of Object.keys(REGION_SYNONYMS)) {
    tokens.add(normalizeArabic(key));
    for (const synonym of REGION_SYNONYMS[key] ?? []) {
      const normalized = normalizeArabic(synonym);
      if (normalized.length >= 4) tokens.add(normalized);
    }
  }

  cachedAreaTokens = [...tokens].filter((t) => t.length >= 4);
  return cachedAreaTokens;
}

/** Tokens for matching office names like «المحكمة» or «حدائق حلوان». */
export function getChatOfficeNameTokens(): string[] {
  if (cachedNameTokens) return cachedNameTokens;

  const tokens = new Set<string>();
  for (const office of buildChatOfficeCatalog()) {
    const full = normalizeArabic(office.centerNameAr);
    if (full.length >= 4) tokens.add(full);
    for (const part of full.split(" ")) {
      if (part.length >= 4) tokens.add(part);
    }
  }

  cachedNameTokens = [...tokens].filter((t) => t.length >= 4);
  return cachedNameTokens;
}

/** True when the message names a known vaccination office (e.g. المحكمة). */
export function messageMatchesChatOfficeCatalog(message: string): boolean {
  const normalized = normalizeArabic(message);
  if (!normalized) return false;

  const nameTokens = getChatOfficeNameTokens();
  if (nameTokens.some((name) => normalized === name)) return true;

  const queryTokens = normalized
    .split(" ")
    .filter((t) => t.length >= 4);
  return queryTokens.some((token) =>
    nameTokens.some(
      (name) => name === token || name.includes(token) || token.includes(name),
    ),
  );
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
