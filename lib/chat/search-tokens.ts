import {
  normalizeArabic,
  stripDefiniteArticleToken,
  tokenizeForSearch,
} from "@/lib/chat/normalize-arabic";

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
  return dedupeSearchTokens(
    tokenizeForSearch(query).filter((token) => !SEARCH_STOP_TOKENS.has(token)),
  );
}

/** One representative token per stem (السعودية + سعودية → single token). */
export function dedupeSearchTokens(tokens: string[]): string[] {
  const byStem = new Map<string, string>();
  for (const token of tokens) {
    const stem = stripDefiniteArticleToken(token);
    const existing = byStem.get(stem);
    if (!existing || token.length > existing.length) {
      byStem.set(stem, token);
    }
  }
  return [...byStem.values()];
}

export function haystackWords(haystack: string): Set<string> {
  const normalized = normalizeArabic(haystack);
  const words = normalized.split(/\s+/).filter((word) => word.length >= 2);
  return new Set(words);
}

export function tokenMatchesHaystack(token: string, words: Set<string>): boolean {
  if (words.has(token)) return true;

  const tokenStem = stripDefiniteArticleToken(token);
  if (tokenStem !== token && words.has(tokenStem)) return true;
  if (words.has(`ال${tokenStem}`)) return true;

  for (const word of words) {
    if (word === token) return true;
    const wordStem = stripDefiniteArticleToken(word);
    if (wordStem === tokenStem) return true;
  }

  return false;
}

export function countTokenMatches(tokens: string[], words: Set<string>): number {
  return tokens.filter((token) => tokenMatchesHaystack(token, words)).length;
}

/** Minimum query tokens that must match for a hit to count (site search + chat). */
export function minimumRequiredTokenMatches(tokenCount: number): number {
  if (tokenCount <= 1) return 1;
  if (tokenCount === 2) return 2;
  return Math.ceil(tokenCount * 0.67);
}

const TITLE_MATCH_SCORE = 5;
const SUBTITLE_MATCH_SCORE = 4;
const TAG_MATCH_SCORE = 3;
const BODY_MATCH_SCORE = 1;

export type KnowledgeEntryMatchScore = {
  score: number;
  matchedTokens: number;
  /** Match in title, subtitle, or tags (not body alone). */
  strongMatch: boolean;
};

export function scoreKnowledgeEntryMatch(
  tokens: string[],
  fields: { title: string; subtitle: string; tags: string; body: string },
): KnowledgeEntryMatchScore {
  const titleWords = haystackWords(fields.title);
  const subtitleWords = haystackWords(fields.subtitle);
  const tagWords = haystackWords(fields.tags);
  const bodyWords = haystackWords(fields.body);

  let score = 0;
  let matchedTokens = 0;
  let strongMatch = false;

  for (const token of tokens) {
    const inTitle = tokenMatchesHaystack(token, titleWords);
    const inSubtitle = tokenMatchesHaystack(token, subtitleWords);
    const inTags = tokenMatchesHaystack(token, tagWords);
    const inBody = tokenMatchesHaystack(token, bodyWords);
    if (!inTitle && !inSubtitle && !inTags && !inBody) continue;

    matchedTokens += 1;
    if (inTitle) score += TITLE_MATCH_SCORE;
    if (inSubtitle) score += SUBTITLE_MATCH_SCORE;
    if (inTags) score += TAG_MATCH_SCORE;
    if (inBody) score += BODY_MATCH_SCORE;
    if (inTitle || inSubtitle || inTags) strongMatch = true;
  }

  return { score, matchedTokens, strongMatch };
}

export function passesKnowledgeSearchThreshold(
  tokens: string[],
  match: KnowledgeEntryMatchScore,
): boolean {
  if (match.matchedTokens < minimumRequiredTokenMatches(tokens.length)) {
    return false;
  }
  if (match.score < 3) return false;
  const loneToken = tokens.length === 1 ? tokens[0] : undefined;
  if (loneToken && loneToken.length >= 3 && !match.strongMatch) {
    return false;
  }
  return true;
}
