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

export function tokenizeForSearch(value: string): string[] {
  const normalized = normalizeArabic(value);
  if (!normalized) return [];
  return normalized.split(" ").filter((token) => token.length >= 2);
}
