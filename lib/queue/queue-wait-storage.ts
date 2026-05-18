import type { QueuePositionPublic } from "@/lib/queue/types";

export const QUEUE_TICKET_STORAGE_KEY = "cqm_queue_ticket_id";
const POSITION_KEY_PREFIX = "cqm_queue_position_";

export function saveQueueTicketId(ticketId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(QUEUE_TICKET_STORAGE_KEY, ticketId);
  } catch {
    /* ignore */
  }
}

export function loadQueueTicketId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(QUEUE_TICKET_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveQueuePosition(
  ticketId: string,
  position: QueuePositionPublic,
) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `${POSITION_KEY_PREFIX}${ticketId}`,
      JSON.stringify(position),
    );
  } catch {
    /* ignore */
  }
}

export function loadQueuePosition(
  ticketId: string,
): QueuePositionPublic | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${POSITION_KEY_PREFIX}${ticketId}`);
    if (!raw) return null;
    return JSON.parse(raw) as QueuePositionPublic;
  } catch {
    return null;
  }
}
