"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

type ChatLabels = {
  title: string;
  subtitle: string;
  greeting: string;
  placeholder: string;
  send: string;
  openAria: string;
  closeAria: string;
  error: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatWidgetProps = {
  locale: string;
  messages: ChatLabels;
};

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getLinkLabel(href: string, labelFromMarkdown?: string) {
  if (labelFromMarkdown) return labelFromMarkdown;
  if (href.startsWith("/")) return "فتح الصفحة";

  try {
    const url = new URL(href);
    if (url.hostname === "maps.app.goo.gl") return "فتح الخريطة";
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "فتح الرابط";
  }
}

function renderTextWithLinks(text: string) {
  const urlPattern =
    /(https?:\/\/[^\s،]+|\/(?:ar|en|zh|fr)(?:\/[^\s،]*)?(?:#[^\s،]+)?)/g;
  const parts: Array<{ type: "text" | "link"; value: string; href?: string; label?: string }> = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const re = new RegExp(
    `\\[([^\\]]+)\\]\\(([^)]+)\\)|(${urlPattern.source})`,
    "g",
  );

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[1] && match[2]) {
      parts.push({ type: "link", label: match[1], href: match[2], value: match[0] });
    } else if (match[3]) {
      const href = match[3].replace(/[.)\]]+$/, "");
      parts.push({ type: "link", href, value: match[3] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  if (parts.length === 0) return text;

  return parts.map((part, index) => {
    if (part.type === "text") {
      const lines = part.value.split("\n");
      return lines.map((line, lineIndex) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      ));
    }

    const href = part.href ?? "";
    return (
      <a
        key={`${index}-link`}
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className="inline-flex rounded-full bg-gov-accent/10 px-2 py-0.5 font-bold text-gov-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-accent"
      >
        {getLinkLabel(href, part.label)}
      </a>
    );
  });
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <>
      {lines.map((line, lineIndex) => (
        <span key={`line-${lineIndex}`}>
          {renderTextWithLinks(line)}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

async function readAssistantStream(
  response: Response,
  onUpdate: (content: string, replace?: boolean) => void,
) {
  if (!response.ok) {
    throw new Error("Chat request failed");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Chat response did not include a stream");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const dataLine = event
          .split("\n")
          .find((line) => line.trim().startsWith("data:"));
        if (!dataLine) continue;

        const data = dataLine.slice(dataLine.indexOf(":") + 1).trim();
        if (data === "[DONE]") return;

        const parsed = JSON.parse(data) as {
          content?: string;
          replace?: boolean;
        };
        if (parsed.replace && parsed.content != null) {
          accumulated = parsed.content;
          onUpdate(accumulated, true);
          continue;
        }
        if (parsed.content) {
          accumulated += parsed.content;
          onUpdate(accumulated, false);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function ChatWidget({ locale, messages: labels }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function ensureGreeting() {
    setChatMessages((current) => {
      if (current.length > 0) return current;
      return [
        {
          id: createId(),
          role: "assistant",
          content: labels.greeting,
        },
      ];
    });
  }

  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    ensureGreeting();
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = input.trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content,
    };
    const assistantMessage: ChatMessage = {
      id: createId(),
      role: "assistant",
      content: "",
    };
    const historyForApi = [...chatMessages, userMessage]
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map(({ role, content: text }) => ({ role, content: text }));

    setInput("");
    setIsLoading(true);
    setChatMessages((current) => [...current, userMessage, assistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          messages: historyForApi,
        }),
      });

      await readAssistantStream(response, (text, replace) => {
        setChatMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? { ...message, content: replace ? text : text }
              : message,
          ),
        );
      });
    } catch {
      setChatMessages((current) =>
        current.map((message) =>
          message.id === assistantMessage.id
            ? { ...message, content: labels.error }
            : message,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex w-full flex-col items-center">
      {open && (
        <section
          aria-label={labels.title}
          className="absolute bottom-[calc(100%+0.75rem)] start-0 z-[70] flex max-h-[min(34rem,calc(100vh-14rem))] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-gov-gray-200 bg-white shadow-2xl shadow-gov-gray-900/20 sm:w-96"
        >
          <header className="flex items-center justify-between gap-3 bg-gov-navy px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">{labels.title}</p>
              <p className="text-xs text-white/80">{labels.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={toggleOpen}
              aria-label={labels.closeAria}
              className="rounded-full p-2 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <CloseIcon className="size-5" />
            </button>
          </header>

          <div
            className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gov-gray-50 px-4 py-4"
            aria-live="polite"
          >
            {chatMessages.map((message) => (
              <div
                key={message.id}
                dir="auto"
                className={
                  message.role === "user"
                    ? "max-w-[85%] break-words self-end rounded-2xl rounded-ee-sm bg-gov-accent px-4 py-3 text-sm leading-6 text-white shadow-sm"
                    : "max-w-[85%] break-words self-start rounded-2xl rounded-es-sm bg-white px-4 py-3 text-sm leading-6 text-gov-gray-900 shadow-sm"
                }
              >
                <MessageContent content={message.content || "..."} />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex gap-2 border-t border-gov-gray-200 bg-white p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={labels.placeholder}
              disabled={isLoading}
              className="min-w-0 flex-1 rounded-full border border-gov-gray-300 px-4 py-2 text-sm text-gov-gray-900 outline-none transition-colors placeholder:text-gov-gray-500 focus:border-gov-accent focus:ring-2 focus:ring-gov-accent/20 disabled:cursor-not-allowed disabled:bg-gov-gray-100"
            />
            <button
              type="submit"
              disabled={isLoading || input.trim().length === 0}
              className="rounded-full bg-gov-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-gov-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-accent disabled:cursor-not-allowed disabled:bg-gov-gray-300"
            >
              {labels.send}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={toggleOpen}
        aria-label={open ? labels.closeAria : labels.openAria}
        title={labels.title}
        className="flex size-14 items-center justify-center rounded-full bg-gov-navy text-white shadow-lg shadow-gov-gray-900/25 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-navy active:scale-95"
      >
        {open ? <CloseIcon className="size-6" /> : <ChatIcon className="size-7" />}
      </button>
    </div>
  );
}
