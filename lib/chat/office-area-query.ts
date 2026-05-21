import { getChatOfficeAreaTokens } from "@/lib/chat/office-catalog";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";

export function isOfficeOrAreaQuery(normalized: string): boolean {
  if (!normalized) return false;

  if (
    normalized.includes("اقرب") ||
    normalized.includes("مكتب") ||
    normalized.includes("مكاتب") ||
    normalized.includes("عنوان") ||
    normalized.includes("office") ||
    normalized.includes("location")
  ) {
    return true;
  }

  const tokens = normalized.split(" ").filter((t) => t.length >= 3);
  if (tokens.length === 0 || tokens.length > 4) return false;

  const areaTokens = getChatOfficeAreaTokens();
  return tokens.some((token) =>
    areaTokens.some(
      (area) => area.includes(token) || token.includes(area),
    ),
  );
}
