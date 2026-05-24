import { classifyChatIntent, type ChatIntent } from "@/lib/chat/intent";
import { normalizeArabic, tokenizeForSearch } from "@/lib/chat/normalize-arabic";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import type { DestinationCountry } from "@/lib/office-requests/types";

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type EffectiveQuery = {
  /** Text used for intent classification and knowledge search. */
  text: string;
  /** Latest raw user message (for handoff / out-of-scope checks). */
  rawMessage: string;
  /** Intent carried from prior turn when the follow-up is short. */
  carriedIntent?: ChatIntent;
};

const FOLLOW_UP_PREFIXES = [
  "و",
  "وا",
  "وفي",
  "في",
  "ب",
  "بال",
  "عن",
  "نفس",
  "كمان",
  "برضو",
  "وكمان",
];

const CONTINUATION_MARKERS = new Set([
  "؟",
  "?",
  "و",
  "في",
  "ب",
  "عن",
  "نفس",
  "كمان",
  "برضو",
]);

function tokenCount(text: string): number {
  return normalizeArabic(text)
    .split(" ")
    .filter((t) => t.length >= 2).length;
}

function stripFollowUpPrefix(normalized: string): string {
  let value = normalized.trim();
  for (const prefix of FOLLOW_UP_PREFIXES) {
    if (value.startsWith(`${prefix} `)) {
      value = value.slice(prefix.length + 1).trim();
    } else if (
      prefix.length <= 2 &&
      value.startsWith(prefix) &&
      value.length > prefix.length
    ) {
      value = value.slice(prefix.length).trim();
    }
  }
  return value;
}

function isShortFollowUp(normalized: string): boolean {
  const stripped = stripFollowUpPrefix(normalized);
  const tokens = stripped.split(" ").filter((t) => t.length >= 2);
  if (tokens.length === 0) return true;
  if (tokens.length <= 3) return true;
  if (tokens.length <= 4 && tokens.every((t) => !CONTINUATION_MARKERS.has(t) || t.length > 1)) {
    return tokens.every((t) => t.length <= 12);
  }
  return false;
}

function lastUserTurnBefore(messages: ChatTurn[], index: number): string | null {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") return messages[i].content;
  }
  return null;
}

function followUpFragmentForMerge(current: string): string {
  const normalized = normalizeArabic(current);
  const stripped = stripFollowUpPrefix(normalized);
  return stripped || normalized;
}

function mergeFollowUpQuery(priorUser: string, current: string): string {
  const prior = priorUser.trim();
  const cur = current.trim();
  if (!prior) return cur;
  if (!cur) return prior;

  const normalizedCur = normalizeArabic(cur);
  const fragment = followUpFragmentForMerge(cur);

  if (
    fragment.includes("نفس") ||
    normalizedCur.includes("نفس الدوله") ||
    normalizedCur.includes("نفس الدولة")
  ) {
    return `${prior} ${prior}`;
  }

  if (
    fragment.includes("السعر") ||
    fragment === "سعر" ||
    fragment.includes("بكام") ||
    fragment === "كام"
  ) {
    return `${prior} ${cur}`;
  }

  return `${prior} ${fragment}`;
}

export function resolveEffectiveQuery(
  messages: ChatTurn[],
  options?: { destinationCountries?: DestinationCountry[] },
): EffectiveQuery {
  const lastIndex = messages.length - 1;
  const rawMessage = messages[lastIndex]?.content?.trim() ?? "";
  if (!rawMessage) {
    return { text: "", rawMessage: "" };
  }

  const normalized = normalizeArabic(rawMessage);
  const priorUser = lastUserTurnBefore(messages, lastIndex);

  if (!priorUser || !isShortFollowUp(normalized)) {
    return { text: rawMessage, rawMessage };
  }

  const priorIntent = classifyChatIntent(priorUser, options);
  const carriedIntents: ChatIntent[] = [
    "office",
    "office_hours",
    "price",
    "destination_vaccines",
    "booking",
    "hajj_umrah",
    "services",
    "checkin_info",
    "complaint_info",
    "international_info",
  ];

  if (!carriedIntents.includes(priorIntent)) {
    const merged = mergeFollowUpQuery(priorUser, rawMessage);
    return { text: merged, rawMessage };
  }

  const merged = mergeFollowUpQuery(priorUser, rawMessage);
  return {
    text: merged,
    rawMessage,
    carriedIntent: priorIntent,
  };
}

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

/** Expand terse follow-ups (e.g. «الخطوات؟») using the previous user turn. */
export function resolveChatMessageForAssistant(
  messages: ChatTurn[],
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
