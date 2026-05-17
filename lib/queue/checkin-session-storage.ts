import { getCairoTodayYmd } from "@/lib/cairo-today-ymd";
import { QUEUE_TICKET_STORAGE_KEY } from "@/lib/queue/queue-wait-storage";

function todayQueueDate(): string {
  return getCairoTodayYmd();
}

export const CHECKIN_SESSION_STORAGE_KEY = "cqm_checkin_session_v1";

export type CheckinSession = {
  officeId: string;
  ticketId?: string;
  queueDate: string;
  lookup?: string;
};

function readSessionForOffice(officeId: string): CheckinSession | null {
  const today = todayQueueDate();
  const stored = readRawSession();
  if (!stored || stored.officeId !== officeId) return null;
  if (stored.queueDate !== today) {
    clearCheckinSession(officeId);
    return null;
  }
  return stored;
}

export function saveCheckinSession(session: CheckinSession): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readRawSession();
    const merged: CheckinSession = {
      officeId: session.officeId,
      queueDate: session.queueDate,
      ...(session.ticketId
        ? { ticketId: session.ticketId }
        : existing?.ticketId
          ? { ticketId: existing.ticketId }
          : {}),
      ...(session.lookup?.trim()
        ? { lookup: session.lookup.trim() }
        : existing?.lookup
          ? { lookup: existing.lookup }
          : {}),
    };
    localStorage.setItem(CHECKIN_SESSION_STORAGE_KEY, JSON.stringify(merged));
    if (merged.ticketId) {
      sessionStorage.setItem(QUEUE_TICKET_STORAGE_KEY, merged.ticketId);
    }
  } catch {
    /* ignore */
  }
}

/** Remember last typed phone/request number for this office (today). */
export function saveCheckinLookupDraft(officeId: string, lookup: string): void {
  const trimmed = lookup.trim();
  if (!trimmed) return;
  const existing = readSessionForOffice(officeId);
  saveCheckinSession({
    officeId,
    queueDate: todayQueueDate(),
    ...(existing?.ticketId ? { ticketId: existing.ticketId } : {}),
    lookup: trimmed,
  });
}

export function clearCheckinSession(officeId?: string): void {
  if (typeof window === "undefined") return;
  try {
    if (!officeId) {
      localStorage.removeItem(CHECKIN_SESSION_STORAGE_KEY);
      sessionStorage.removeItem(QUEUE_TICKET_STORAGE_KEY);
      return;
    }
    const current = readRawSession();
    if (current?.officeId === officeId) {
      localStorage.removeItem(CHECKIN_SESSION_STORAGE_KEY);
      sessionStorage.removeItem(QUEUE_TICKET_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

function readRawSession(): CheckinSession | null {
  try {
    const raw = localStorage.getItem(CHECKIN_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const data = parsed as Record<string, unknown>;
    if (typeof data.officeId !== "string" || typeof data.queueDate !== "string") {
      return null;
    }
    return {
      officeId: data.officeId,
      queueDate: data.queueDate,
      ...(typeof data.ticketId === "string" && data.ticketId.trim()
        ? { ticketId: data.ticketId.trim() }
        : {}),
      ...(typeof data.lookup === "string" && data.lookup.trim()
        ? { lookup: data.lookup.trim() }
        : {}),
    };
  } catch {
    return null;
  }
}

/** Active ticket session for restore (today, same office). */
export function loadCheckinSession(
  officeId: string,
): (CheckinSession & { ticketId: string }) | null {
  if (typeof window === "undefined") return null;
  const today = todayQueueDate();
  const stored = readSessionForOffice(officeId);
  if (stored?.ticketId) {
    return { ...stored, ticketId: stored.ticketId };
  }

  try {
    const legacyTicketId = sessionStorage.getItem(QUEUE_TICKET_STORAGE_KEY);
    if (legacyTicketId) {
      return {
        officeId,
        ticketId: legacyTicketId,
        queueDate: today,
        ...(stored?.lookup ? { lookup: stored.lookup } : {}),
      };
    }
  } catch {
    /* ignore */
  }

  return null;
}

/** Last lookup value for this office (even before a ticket exists). */
export function loadCheckinLookup(officeId: string): string {
  return readSessionForOffice(officeId)?.lookup ?? "";
}
