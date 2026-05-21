import { enforceResponseRules } from "@/lib/chat/enforce-response";
import { isHumanHandoffRequest } from "@/lib/chat/human-handoff";
import { getLocalChatResponse } from "@/lib/chat/local-responses";
import { isOutOfScopeMessage } from "@/lib/chat/out-of-scope";
import {
  buildSiteKnowledgeContext,
  buildSiteKnowledgeIndex,
  isWeakSearchResult,
  searchSiteKnowledge,
} from "@/lib/chat/site-knowledge";
import { buildSystemPrompt } from "@/lib/chat/system-prompt";
import {
  whatsappHumanHandoffMessage,
  whatsappOutOfScopeMessage,
  whatsappUnknownInfoMessage,
} from "@/lib/chat/whatsapp-fallback";
import {
  listDestinationCountriesForPublic,
  listOffices,
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

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OPENROUTER_MODEL = "deepseek/deepseek-chat-v3.1:free";
const DEFAULT_OPENROUTER_FALLBACK_MODEL = "deepseek/deepseek-chat-v3.1:free";

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

function getModelConfig() {
  const model =
    process.env.OPENROUTER_CHAT_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
  const fallbackModel =
    process.env.OPENROUTER_CHAT_FALLBACK_MODEL?.trim() ||
    DEFAULT_OPENROUTER_FALLBACK_MODEL;

  return { model, fallbackModel };
}

function streamTextResponse(content: string) {
  const encoder = new TextEncoder();
  const enforced = content;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ content: enforced })}\n\n`),
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

function streamOpenRouterResponse(response: Response, locale: string | undefined) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      let buffer = "";
      let fullText = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith("data:")) continue;

            const data = trimmedLine.slice(5).trim();
            if (data === "[DONE]") {
              const finalText = enforceResponseRules(fullText, locale);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ content: finalText, replace: true })}\n\n`,
                ),
              );
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
                );
              }
            } catch {
              // Ignore non-token stream events from the provider.
            }
          }
        }

        const finalText = enforceResponseRules(fullText, locale);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ content: finalText, replace: true })}\n\n`,
          ),
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

function requestOpenRouter({
  apiKey,
  locale,
  messages,
  model,
  knowledgeContext,
}: {
  apiKey: string;
  locale: string | undefined;
  messages: ChatMessage[];
  model: string;
  knowledgeContext: string;
}) {
  return fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
        "https://cairo-quarantine-management.local",
      "X-Title": "Cairo Quarantine Management",
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.1,
      max_tokens: 200,
      messages: [
        { role: "system", content: buildSystemPrompt(locale) },
        { role: "system", content: knowledgeContext },
        ...messages,
      ],
    }),
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

  const lastUserMessage = messages[messages.length - 1].content;
  const locale = body.locale;

  if (isHumanHandoffRequest(lastUserMessage)) {
    return new Response(
      streamTextResponse(whatsappHumanHandoffMessage(locale)),
      { headers: sseHeaders() },
    );
  }

  if (isOutOfScopeMessage(lastUserMessage)) {
    return new Response(
      streamTextResponse(whatsappOutOfScopeMessage(locale)),
      { headers: sseHeaders() },
    );
  }

  const [knowledgeIndex, destinationCountries, portalOffices] =
    await Promise.all([
      buildSiteKnowledgeIndex(locale),
      listDestinationCountriesForPublic(),
      listOffices(),
    ]);
  const searchHits = searchSiteKnowledge(lastUserMessage, knowledgeIndex, 5);

  const localResponse = getLocalChatResponse({
    locale,
    message: lastUserMessage,
    knowledgeIndex,
    destinationCountries,
    portalOffices,
  });

  if (localResponse) {
    const isOfficeReply =
      localResponse.includes("tel:") ||
      localResponse.includes("maps.app.goo.gl") ||
      localResponse.includes("google.com/maps");
    const isLongLocalReply =
      isOfficeReply ||
      localResponse.includes("international-traveler") ||
      localResponse.includes("متطلبات التطعيم") ||
      localResponse.includes("مواعيد العمل");
    return new Response(
      streamTextResponse(
        enforceResponseRules(localResponse, locale, {
          maxLines: isLongLocalReply ? 16 : 6,
        }),
      ),
      { headers: sseHeaders() },
    );
  }

  if (isWeakSearchResult(lastUserMessage, searchHits)) {
    return new Response(
      streamTextResponse(whatsappUnknownInfoMessage(locale)),
      { headers: sseHeaders() },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.error("[chat] OPENROUTER_API_KEY is not configured");
    return new Response(
      streamTextResponse(whatsappUnknownInfoMessage(locale)),
      { headers: sseHeaders() },
    );
  }

  const knowledgeContext = buildSiteKnowledgeContext(locale, searchHits);
  const { model, fallbackModel } = getModelConfig();

  let openRouterResponse = await requestOpenRouter({
    apiKey,
    locale,
    messages,
    model,
    knowledgeContext,
  });

  if (openRouterResponse.status === 402 && fallbackModel !== model) {
    openRouterResponse = await requestOpenRouter({
      apiKey,
      locale,
      messages,
      model: fallbackModel,
      knowledgeContext,
    });
  }

  if (!openRouterResponse.ok) {
    console.error(
      "[chat] OpenRouter failed",
      openRouterResponse.status,
      await openRouterResponse.text().catch(() => ""),
    );
    return new Response(
      streamTextResponse(whatsappUnknownInfoMessage(locale)),
      { headers: sseHeaders() },
    );
  }

  return new Response(streamOpenRouterResponse(openRouterResponse, locale), {
    headers: sseHeaders(),
  });
}
