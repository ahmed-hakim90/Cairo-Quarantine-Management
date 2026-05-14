import { getLocalChatResponse } from "@/lib/chat/local-responses";
import { buildPortalContextSnippet } from "@/lib/chat/portal-context";

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

function getLanguageName(locale: string | undefined) {
  if (locale === "en") return "English";
  if (locale === "zh") return "Chinese";
  return "Arabic";
}

function buildSystemPrompt(locale: string | undefined) {
  const defaultLanguage = getLanguageName(locale);

  return [
    "You are the smart assistant for the Cairo Quarantine Management portal.",
    `The current site language is ${defaultLanguage}.`,
    "Always detect the user's message language and answer only in that same language.",
    "Help users with quarantine, traveler vaccination, Hajj/Umrah vaccination, citizen vaccination, office locations, documents, booking, and complaint steps.",
    "For Arabic replies, use clear simple Modern Standard Arabic. Do not use broken Arabic, nonsense words, or dialect unless the user explicitly asks for it.",
    "Never restate a malformed version of the user's question. If the question is unclear, ask for one short clarification sentence only.",
    "Default answer format: first give a clear two-line maximum summary, then a numbered list of 3 to 7 practical steps.",
    "Keep each numbered step short and useful. Do not write long paragraphs.",
    "For Hajj/Umrah questions, prioritize required documents, core vaccinations, vaccination certificate, nearest authorized office guidance, and official confirmation.",
    "For nearest office, address, phone, or map questions, never invent a specific office, address, phone number, or map link. Direct the user to the portal office/location table and ask them for their area if needed.",
    "Use the available conversation context and general knowledge only; do not claim that you searched the web or checked live Ministry of Health pages.",
    "If current official information is required, say clearly that the user should confirm through official Ministry channels or the nearest authorized vaccination office.",
    "Do not invent prices, appointment availability, medical advice, or legal requirements. Present medical guidance as informational and advise users to confirm with authorized health staff.",
  ].join("\n");
}

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

function requestOpenRouter({
  apiKey,
  locale,
  messages,
  model,
}: {
  apiKey: string;
  locale: string | undefined;
  messages: ChatMessage[];
  model: string;
}) {
  return fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://cairo-quarantine-management.local",
      "X-Title": "Cairo Quarantine Management",
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.1,
      messages: [
        { role: "system", content: buildSystemPrompt(locale) },
        { role: "system", content: buildPortalContextSnippet(locale) },
        ...messages,
      ],
    }),
  });
}

function streamOpenRouterResponse(response: Response) {
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
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
                );
              }
            } catch {
              // Ignore non-token stream events from the provider.
            }
          }
        }

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

function streamTextResponse(content: string) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Missing OPENROUTER_API_KEY environment variable." },
      { status: 500 },
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

  const localResponse = getLocalChatResponse({
    locale: body.locale,
    message: messages[messages.length - 1].content,
  });

  if (localResponse) {
    return new Response(streamTextResponse(localResponse), {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "text/event-stream; charset=utf-8",
      },
    });
  }

  const { model, fallbackModel } = getModelConfig();
  let openRouterResponse = await requestOpenRouter({
    apiKey,
    locale: body.locale,
    messages,
    model,
  });

  if (openRouterResponse.status === 402 && fallbackModel !== model) {
    openRouterResponse = await requestOpenRouter({
      apiKey,
      locale: body.locale,
      messages,
      model: fallbackModel,
    });
  }

  if (!openRouterResponse.ok) {
    const errorText = await openRouterResponse.text();
    return Response.json(
      {
        error: "OpenRouter request failed.",
        code:
          openRouterResponse.status === 402
            ? "openrouter_billing_required"
            : "openrouter_request_failed",
        detail: errorText.slice(0, 1000),
      },
      { status: openRouterResponse.status },
    );
  }

  return new Response(streamOpenRouterResponse(openRouterResponse), {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
