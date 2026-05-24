import type { ChatTurn } from "@/lib/chat/conversation-context";
import { resolveEffectiveQuery } from "@/lib/chat/conversation-context";
import type { ChatIntent } from "@/lib/chat/intent";
import { enforceResponseRules } from "@/lib/chat/enforce-response";
import { isHumanHandoffRequest } from "@/lib/chat/human-handoff";
import { getLocalChatResponse } from "@/lib/chat/local-responses";
import { isOutOfScopeMessage } from "@/lib/chat/out-of-scope";
import type { PortalAssistantResponse } from "@/lib/chat/portal-assistant-types";
import {
  isWeakSearchResult,
  searchSiteKnowledge,
  type SiteKnowledgeEntry,
} from "@/lib/chat/site-knowledge";
import {
  whatsappHumanHandoffMessage,
  whatsappOutOfScopeMessage,
  whatsappUnknownInfoMessage,
} from "@/lib/chat/whatsapp-fallback";
import type { UserCategory, VaccineRecord } from "@/data/vaccines";
import type { DestinationCountry, Office } from "@/lib/office-requests/types";

export type ResolvePortalAssistantInput = {
  locale: string | undefined;
  message: string;
  messages?: ChatTurn[];
  knowledgeIndex: SiteKnowledgeEntry[];
  destinationCountries: DestinationCountry[];
  portalOffices: Office[];
  vaccinesByCategory: Record<UserCategory, VaccineRecord[]>;
};

function contactResponse(
  answer: string,
  source: string,
  confidence = 0.95,
): PortalAssistantResponse {
  return { answer, source, type: "contact", confidence };
}

function searchFallback(
  locale: string | undefined,
  message: string,
  knowledgeIndex: SiteKnowledgeEntry[],
  options?: { intent?: ChatIntent },
): PortalAssistantResponse | null {
  const hits = searchSiteKnowledge(message, knowledgeIndex, 5);
  if (isWeakSearchResult(message, hits)) return null;
  void options;

  const hit = hits[0];
  const type =
    hit.category === "offices"
      ? "office"
      : hit.category === "vaccine"
        ? "vaccine"
        : "contact";

  return {
    answer: `${hit.body.slice(0, 220)}\n[${hit.title}](${hit.path})`,
    source: hit.title,
    type,
    confidence: 0.75,
  };
}

export function resolvePortalAssistant(
  input: ResolvePortalAssistantInput,
): PortalAssistantResponse {
  const {
    locale,
    message,
    messages = [],
    knowledgeIndex,
    destinationCountries,
    portalOffices,
    vaccinesByCategory,
  } = input;

  const turns: ChatTurn[] =
    messages.length > 0
      ? messages
      : [{ role: "user", content: message }];

  const effective = resolveEffectiveQuery(turns, { destinationCountries });
  const rawMessage = effective.rawMessage || message;
  const queryText = effective.text || message;

  if (isHumanHandoffRequest(rawMessage)) {
    return contactResponse(
      whatsappHumanHandoffMessage(locale),
      locale === "ar" ? "المنصة" : "Portal",
    );
  }

  if (isOutOfScopeMessage(rawMessage)) {
    return contactResponse(
      whatsappOutOfScopeMessage(locale),
      locale === "ar" ? "المنصة" : "Portal",
    );
  }

  const local = getLocalChatResponse({
    locale,
    message: queryText,
    knowledgeIndex,
    destinationCountries,
    portalOffices,
    vaccinesByCategory,
    carriedIntent: effective.carriedIntent,
  });

  if (local) return local;

  const fromSearch = searchFallback(locale, queryText, knowledgeIndex, {
    intent: effective.carriedIntent,
  });
  if (fromSearch) return fromSearch;

  return contactResponse(
    whatsappUnknownInfoMessage(locale),
    locale === "ar" ? "المنصة" : "Portal",
    0.5,
  );
}

export function applyPortalAssistantRules(
  response: PortalAssistantResponse,
  locale: string | undefined,
): PortalAssistantResponse {
  const isOfficeReply = response.type === "office";
  const isLongReply =
    isOfficeReply ||
    response.answer.includes("international-traveler") ||
    response.answer.includes("متطلبات التطعيم") ||
    response.answer.includes("مواعيد العمل");

  const maxLines = isOfficeReply
    ? 24
    : isLongReply
      ? 16
      : 6;

  return {
    ...response,
    answer: enforceResponseRules(response.answer, locale, { maxLines }),
  };
}
