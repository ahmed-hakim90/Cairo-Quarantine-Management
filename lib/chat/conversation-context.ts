import { normalizeArabic, tokenizeForSearch } from "@/lib/chat/normalize-arabic";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

const HELP_TOPIC_SIGNALS = ["تساعد", "مساعد", "help", "capabilities", "assist"];
const BOOKING_TOPIC_SIGNALS = ["حجز", "booking", "موعد", "appointment"];

function isShortStepsFollowUp(normalized: string): boolean {
  const tokens = tokenizeForSearch(normalized);
  if (tokens.length > 4) return false;
  return (
    normalized.includes("خطوات") ||
    normalized.includes("steps") ||
    (normalized.includes("ايه") && tokens.length <= 3)
  );
}

function expandedStepsQuery(locale: Locale): string {
  if (locale === "en") return "booking steps on the portal";
  if (locale === "fr") return "etapes de reservation sur le portail";
  if (locale === "zh") return "门户网站预约步骤";
  return "خطوات الحجز في البوابة";
}

function priorUserIndicatesTopic(priorNormalized: string): boolean {
  return (
    HELP_TOPIC_SIGNALS.some((signal) => priorNormalized.includes(signal)) ||
    BOOKING_TOPIC_SIGNALS.some((signal) => priorNormalized.includes(signal))
  );
}

/** Expand terse follow-ups using the previous user turn when appropriate. */
export function resolveChatMessageForAssistant(
  messages: ConversationMessage[],
  localeValue: string | undefined,
): string {
  if (messages.length === 0) return "";

  const last = messages[messages.length - 1];
  if (last.role !== "user") return last.content;

  const normalized = normalizeArabic(last.content);
  if (!isShortStepsFollowUp(normalized)) return last.content;

  const priorUser = [...messages]
    .slice(0, -1)
    .reverse()
    .find((message) => message.role === "user");
  if (!priorUser) return last.content;

  const priorNormalized = normalizeArabic(priorUser.content);
  if (!priorUserIndicatesTopic(priorNormalized)) return last.content;

  const locale =
    localeValue && isLocale(localeValue) ? localeValue : defaultLocale;
  return expandedStepsQuery(locale);
}
