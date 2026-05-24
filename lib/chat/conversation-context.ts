import { classifyChatIntent, type ChatIntent } from "@/lib/chat/intent";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";
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
