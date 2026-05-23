export function normalizeArabic(value: string) {
  return value
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Strip leading definite article for search tokens only (not full-message normalization). */
export function stripDefiniteArticleToken(token: string): string {
  if (token.startsWith("ال") && token.length > 4) {
    return token.slice(2);
  }
  return token;
}

export function tokenizeForSearch(value: string): string[] {
  const normalized = normalizeArabic(value);
  if (!normalized) return [];
  const raw = normalized.split(" ").filter((token) => token.length >= 2);
  const expanded = new Set<string>();
  for (const token of raw) {
    expanded.add(token);
    const stripped = stripDefiniteArticleToken(token);
    if (stripped !== token && stripped.length >= 2) {
      expanded.add(stripped);
    }
  }
  return [...expanded];
}

/** Prefix match (3+ chars) for fuzzy knowledge search. */
export function tokenMatchesHaystack(token: string, haystack: string): boolean {
  if (haystack.includes(token)) return true;
  if (token.length < 3) return false;
  const words = haystack.split(" ").filter(Boolean);
  return words.some(
    (word) => word.startsWith(token) || token.startsWith(word),
  );
}
