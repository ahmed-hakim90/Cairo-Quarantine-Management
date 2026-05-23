import { normalizeArabic, tokenizeForSearch } from "@/lib/chat/normalize-arabic";

/** Tokens ignored for site-knowledge search only (intent routing keeps them). */
export const SEARCH_STOP_TOKENS = new Set([
  "في",
  "ايه",
  "هي",
  "هو",
  "هم",
  "ان",
  "من",
  "على",
  "الى",
  "عن",
  "لي",
  "كده",
  "كدا",
  "the",
  "a",
  "an",
  "is",
  "to",
  "of",
  "in",
  "what",
  "how",
]);

export function tokenizeForKnowledgeSearch(query: string): string[] {
  return tokenizeForSearch(query).filter((token) => !SEARCH_STOP_TOKENS.has(token));
}

export function haystackWords(haystack: string): Set<string> {
  const normalized = normalizeArabic(haystack);
  const words = normalized.split(/\s+/).filter((word) => word.length >= 2);
  return new Set(words);
}

export function tokenMatchesHaystack(token: string, words: Set<string>): boolean {
  return words.has(token);
}

export function countTokenMatches(tokens: string[], words: Set<string>): number {
  return tokens.filter((token) => tokenMatchesHaystack(token, words)).length;
}
