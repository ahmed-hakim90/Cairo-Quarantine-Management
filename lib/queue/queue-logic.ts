import type { QueueTicketStatus } from "@/lib/queue/types";

/** Notify citizen when exactly this many people are ahead in the queue. */
export const AHEAD_NOTIFY_AT = 5;

/** Next queue number after `lastQueueNumber` (0 → first ticket is 1). */
export function nextQueueNumber(lastQueueNumber: number): number {
  return lastQueueNumber + 1;
}

export function shouldSkipNewTicket(existingTicketExists: boolean): boolean {
  return existingTicketExists;
}

export function shouldIncrementTotalCompleted(status: QueueTicketStatus): boolean {
  return status !== "completed";
}

export function computeTotalNoShow(
  totalCheckedIn: number,
  totalCompleted: number,
): number {
  return Math.max(0, totalCheckedIn - totalCompleted);
}

/** True when the search value is a plain queue number (digits only). */
export function isQueueNumberSearch(value: string): boolean {
  const raw = value.trim();
  return raw.length > 0 && /^\d+$/.test(raw);
}

export function parseQueueNumberSearch(value: string): number {
  return Number.parseInt(value.trim(), 10);
}
