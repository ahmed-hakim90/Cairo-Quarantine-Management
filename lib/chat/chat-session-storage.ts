export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type StoredChatSession = {
  messages: StoredChatMessage[];
  open: boolean;
  updatedAt: number;
};

const STORAGE_PREFIX = "cqm-public-chat:";

function storageKey(locale: string): string {
  return `${STORAGE_PREFIX}${locale}`;
}

export function loadChatSession(locale: string): StoredChatSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(storageKey(locale));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredChatSession;
    if (!Array.isArray(parsed.messages)) return null;

    const messages = parsed.messages.filter(
      (m): m is StoredChatMessage =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        typeof m.id === "string",
    );

    return {
      messages,
      open: Boolean(parsed.open),
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
    };
  } catch {
    return null;
  }
}

export function saveChatSession(locale: string, session: StoredChatSession): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      storageKey(locale),
      JSON.stringify({
        messages: session.messages.slice(-50),
        open: session.open,
        updatedAt: session.updatedAt,
      }),
    );
  } catch {
    // Quota or private mode — ignore.
  }
}
