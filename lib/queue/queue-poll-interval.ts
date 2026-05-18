import type { QueueTicketStatus } from "@/lib/queue/types";

/** Stop polling when the ticket is done or the day queue is closed. */
export function shouldStopQueuePolling(args: {
  status: QueueTicketStatus;
  queueClosed: boolean;
}): boolean {
  return args.status === "completed" || args.queueClosed;
}

/**
 * Adaptive poll interval for citizen queue wait UI.
 * - ahead > 20: 60s
 * - ahead 6–20: 30s
 * - ahead ≤ 5: 12s
 */
export function getQueuePollIntervalMs(
  aheadCount: number | null | undefined,
): number {
  if (aheadCount == null || !Number.isFinite(aheadCount)) return 20_000;
  if (aheadCount > 20) return 60_000;
  if (aheadCount > 5) return 30_000;
  return 12_000;
}
