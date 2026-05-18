import type { Redis } from "ioredis";

/** Live queue snapshot — not source of truth; rebuild from PostgreSQL on miss. */
export type QueueTicketLiveState = {
  ticketId: string;
  officeId: string;
  queueDate: string;
  queueNumber: number;
  status: "waiting" | "completed";
  aheadCount?: number;
  updatedAt: string;
};

function queueLiveKey(ticketId: string): string {
  return `queue:live:${ticketId}`;
}

function queueOfficeDayKey(officeId: string, queueDate: string): string {
  return `queue:office:${officeId}:${queueDate}:last_number`;
}

const LIVE_TTL_SECONDS = 86_400;

export async function setQueueTicketLiveState(
  redis: Redis,
  state: QueueTicketLiveState,
): Promise<void> {
  await redis.set(
    queueLiveKey(state.ticketId),
    JSON.stringify(state),
    "EX",
    LIVE_TTL_SECONDS,
  );
}

export async function getQueueTicketLiveState(
  redis: Redis,
  ticketId: string,
): Promise<QueueTicketLiveState | null> {
  const raw = await redis.get(queueLiveKey(ticketId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QueueTicketLiveState;
  } catch {
    return null;
  }
}

export async function invalidateQueueTicketLiveState(
  redis: Redis,
  ticketId: string,
): Promise<void> {
  await redis.del(queueLiveKey(ticketId));
}

/** Fast hint for last issued number; PG transaction remains authoritative. */
export async function bumpOfficeDayLastQueueNumber(
  redis: Redis,
  officeId: string,
  queueDate: string,
  queueNumber: number,
): Promise<void> {
  const key = queueOfficeDayKey(officeId, queueDate);
  await redis.set(key, String(queueNumber), "EX", LIVE_TTL_SECONDS);
}

export async function getOfficeDayLastQueueNumberHint(
  redis: Redis,
  officeId: string,
  queueDate: string,
): Promise<number | null> {
  const raw = await redis.get(queueOfficeDayKey(officeId, queueDate));
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}
