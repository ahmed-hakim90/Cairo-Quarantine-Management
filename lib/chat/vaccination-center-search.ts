import {
  buildChatOfficeCatalog,
  officeHaystack,
  type ChatOffice,
} from "@/lib/chat/office-catalog";
import { normalizeArabic, tokenizeForSearch } from "@/lib/chat/normalize-arabic";

const STOP_TOKENS = new Set([
  "في",
  "فى",
  "من",
  "على",
  "الى",
  "الي",
  "عن",
  "هل",
  "فيها",
  "فيه",
  "كمان",
  "تاني",
  "ثاني",
  "مكاتب",
  "مكتب",
  "مواعيد",
  "موعد",
  "office",
  "offices",
  "location",
  "locations",
  "؟",
]);

/** Expand region tokens (e.g. تجمع → also match القاهرة الجديدة). */
const REGION_SYNONYMS: Record<string, string[]> = {
  تجمع: ["تجمع", "القاهره الجديده", "القاهرة الجديدة"],
  حلوان: ["حلوان", "حدائق حلوان"],
};

function meaningfulTokens(query: string): string[] {
  return tokenizeForSearch(query).filter((token) => !STOP_TOKENS.has(token));
}

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const synonyms = REGION_SYNONYMS[token];
    if (synonyms) {
      for (const synonym of synonyms) {
        expanded.add(normalizeArabic(synonym));
      }
    }
  }
  return [...expanded];
}

function scoreOffice(office: ChatOffice, tokens: string[]): number {
  const haystack = officeHaystack(office);
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 2;
  }
  if (
    tokens.some((t) => normalizeArabic(office.administrationAr).includes(t)) ||
    tokens.some((t) => normalizeArabic(office.administrationEn).includes(t))
  ) {
    score += 3;
  }
  return score;
}

/** Returns all offices matching the area/query tokens (not only one administration). */
export function findVaccinationCenters(
  query: string,
  limit = 8,
): ChatOffice[] {
  const tokens = expandTokens(meaningfulTokens(query));
  if (tokens.length === 0) return [];

  const catalog = buildChatOfficeCatalog();
  const matches = catalog.filter((office) => {
    const haystack = officeHaystack(office);
    return tokens.some((token) => haystack.includes(token));
  });

  if (matches.length > 0) {
    const scored = matches
      .map((row) => ({ row, score: scoreOffice(row, tokens) }))
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((entry) => entry.row);
  }

  const scored = catalog
    .map((row) => ({ row, score: scoreOffice(row, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.row);
}
