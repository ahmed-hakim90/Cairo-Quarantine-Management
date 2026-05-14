import type {
  OfficeRequest,
  OfficeRequestStatus,
  OfficeRequestType,
} from "@/lib/office-requests/types";

export type AdminRequestAnalytics = {
  byStatus: Record<OfficeRequestStatus, number>;
  byType: Record<OfficeRequestType, number>;
  /** ISO week start date (YYYY-MM-DD) → count, last 90 days, weekly buckets */
  timelineWeeks: { weekStart: string; count: number }[];
};

const STATUSES: OfficeRequestStatus[] = [
  "new",
  "in_progress",
  "contacted",
  "completed",
  "cancelled",
];

const TYPES: OfficeRequestType[] = ["booking", "complaint", "proposal"];

function startOfWeekUtc(d: Date): Date {
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // Monday as week start
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() - diff);
  return t;
}

function formatDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildAdminRequestAnalytics(
  requests: OfficeRequest[],
  options?: { timelineDays?: number },
): AdminRequestAnalytics {
  const timelineDays = options?.timelineDays ?? 90;
  const cutoff = Date.now() - timelineDays * 24 * 60 * 60 * 1000;

  const byStatus = Object.fromEntries(
    STATUSES.map((s) => [s, 0]),
  ) as Record<OfficeRequestStatus, number>;
  const byType = Object.fromEntries(TYPES.map((t) => [t, 0])) as Record<
    OfficeRequestType,
    number
  >;

  const weekCounts = new Map<string, number>();

  for (const r of requests) {
    byStatus[r.status] += 1;
    byType[r.type] += 1;

    const created = Date.parse(r.createdAt);
    if (Number.isNaN(created) || created < cutoff) continue;

    const weekStart = startOfWeekUtc(new Date(created));
    const key = formatDay(weekStart);
    weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);
  }

  const sortedKeys = [...weekCounts.keys()].sort();
  const timelineWeeks = sortedKeys.map((weekStart) => ({
    weekStart,
    count: weekCounts.get(weekStart) ?? 0,
  }));

  return { byStatus, byType, timelineWeeks };
}
