export const QUEUE_TICKET_STORAGE_KEY = "cqm_queue_ticket_id";

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
