import type { PortalAssistantMeta } from "@/lib/chat/portal-assistant-types";
import {
  applyPortalAssistantRules,
  resolvePortalAssistant,
} from "@/lib/chat/portal-assistant";
import { resolveChatMessageForAssistant } from "@/lib/chat/conversation-context";
import { buildSiteKnowledgeIndex } from "@/lib/chat/site-knowledge";
import {
  listDestinationCountriesForPublic,
  listOffices,
  listVaccinesByCategoryForPublic,
} from "@/lib/office-requests/store";
import { rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import { checkUnifiedRateLimit } from "@/lib/rate-limit-unified";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequestBody = {
  messages?: ChatMessage[];
  locale?: string;
};

function sanitizeMessages(messages: ChatMessage[] | undefined): ChatMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter(
      (message): message is ChatMessage =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 4000),
    }));
}

function streamAssistantResponse(
  content: string,
  meta: PortalAssistantMeta,
) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
      );
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ content, replace: true, meta })}\n\n`,
        ),
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

function sseHeaders() {
  return {
    "Cache-Control": "no-cache, no-transform",
    "Content-Type": "text/event-stream; charset=utf-8",
  };
}

export async function POST(request: Request) {
  const rateLimit = await checkUnifiedRateLimit({
    scope: "chat",
    key: rateLimitKeyFromHeaders(request.headers, "chat"),
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = sanitizeMessages(body.messages);
  if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
    return Response.json(
      { error: "A user message is required." },
      { status: 400 },
    );
  }

  const locale = body.locale;
  const lastUserMessage = resolveChatMessageForAssistant(messages, locale);

  const [knowledgeIndex, destinationCountries, portalOffices, vaccinesByCategory] =
    await Promise.all([
      buildSiteKnowledgeIndex(locale),
      listDestinationCountriesForPublic(),
      listOffices(),
      listVaccinesByCategoryForPublic(),
    ]);

  const resolved = resolvePortalAssistant({
    locale,
    message: lastUserMessage,
    knowledgeIndex,
    destinationCountries,
    portalOffices,
    vaccinesByCategory,
  });

  const final = applyPortalAssistantRules(resolved, locale);
  const meta: PortalAssistantMeta = {
    source: final.source,
    type: final.type,
    confidence: final.confidence,
  };

  return new Response(streamAssistantResponse(final.answer, meta), {
    headers: sseHeaders(),
  });
}
