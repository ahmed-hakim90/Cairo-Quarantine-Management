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
): PortalAssistantResponse | null {
  const hits = searchSiteKnowledge(message, knowledgeIndex, 5);
  if (isWeakSearchResult(message, hits)) return null;

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
  const { locale, message, knowledgeIndex, destinationCountries, portalOffices, vaccinesByCategory } =
    input;

  if (isHumanHandoffRequest(message)) {
    return contactResponse(
      whatsappHumanHandoffMessage(locale),
      locale === "ar" ? "المنصة" : "Portal",
    );
  }

  if (isOutOfScopeMessage(message)) {
    return contactResponse(
      whatsappOutOfScopeMessage(locale),
      locale === "ar" ? "المنصة" : "Portal",
    );
  }

  const local = getLocalChatResponse({
    locale,
    message,
    knowledgeIndex,
    destinationCountries,
    portalOffices,
    vaccinesByCategory,
  });

  if (local) return local;

  const fromSearch = searchFallback(locale, message, knowledgeIndex);
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

  return {
    ...response,
    answer: enforceResponseRules(response.answer, locale, {
      maxLines: isLongReply ? 16 : 6,
    }),
  };
}
