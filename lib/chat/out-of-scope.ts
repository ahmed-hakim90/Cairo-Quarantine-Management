import { messageMatchesChatOfficeCatalog } from "@/lib/chat/office-catalog";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";

const OUT_OF_SCOPE_PATTERNS = [
  "تشخيص",
  "اعراض",
  "حمى",
  "حراره",
  "دواء",
  "علاج",
  "طبيب",
  "مريض",
  "مرض",
  "سرطان",
  "حامل",
  "حمل",
  "قانون",
  "دعوه",
  "خبر",
  "اخبار",
  "سياسه",
  "اسعار الذهب",
  "bitcoin",
  "diagnos",
  "symptom",
  "fever",
  "medicine",
  "treatment",
  "doctor",
  "patient",
  "disease",
  "cancer",
  "pregnant",
  "legal",
  "news",
  "politic",
];

export function isOutOfScopeMessage(message: string): boolean {
  const normalized = normalizeArabic(message);
  if (!normalized) return false;
  if (messageMatchesChatOfficeCatalog(message)) return false;

  return OUT_OF_SCOPE_PATTERNS.some((pattern) => {
    const p = normalizeArabic(pattern);
    return normalized.includes(p);
  });
}
