import type { DailyRequestStats } from "@/lib/office-requests/daily-request-stats";
import type { AggregatedDailyQueueStats } from "@/lib/queue/daily-stats-service";
import type {
  Office,
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

export type OfficePerformanceRating = {
  officeId: string;
  officeNameAr: string;
  bookings: number;
  complaints: number;
  proposals: number;
  completed: number;
};

export type OfficePerformanceSortKey =
  | "officeNameAr"
  | "bookings"
  | "completed"
  | "complaints";

export type OfficePerformanceSortDirection = "asc" | "desc";

export function sortOfficePerformanceRatingsBy(
  ratings: OfficePerformanceRating[],
  key: OfficePerformanceSortKey,
  direction: OfficePerformanceSortDirection,
): OfficePerformanceRating[] {
  const factor = direction === "asc" ? 1 : -1;

  return [...ratings].sort((a, b) => {
    if (key === "officeNameAr") {
      const cmp = a.officeNameAr.localeCompare(b.officeNameAr, "ar");
      if (cmp !== 0) return cmp * factor;
      return a.officeId.localeCompare(b.officeId);
    }

    const diff = a[key] - b[key];
    if (diff !== 0) return diff * factor;
    return a.officeNameAr.localeCompare(b.officeNameAr, "ar");
  });
}

/** Default table order: highest bookings first. */
export function sortOfficePerformanceRatings(
  ratings: OfficePerformanceRating[],
): OfficePerformanceRating[] {
  return sortOfficePerformanceRatingsBy(ratings, "bookings", "desc");
}

export type QueueDailyAnalyticsSummary = {
  totalCheckedIn: number;
  totalCompleted: number;
  totalNoShow: number;
};

const STATUSES: OfficeRequestStatus[] = [
  "new",
  "in_progress",
  "contacted",
  "completed",
  "cancelled",
];

const TYPES: OfficeRequestType[] = ["booking", "complaint", "proposal"];

export type AdminBookingQueueSection = {
  totalBookings: number;
  checkedIn: number;
  completed: number;
  notCompleted: number;
};

export type AdminFeedbackSection = {
  total: number;
  newCount: number;
};

export function buildBookingQueueSection(
  totalBookings: number,
  queue: AggregatedDailyQueueStats,
): AdminBookingQueueSection {
  return {
    totalBookings,
    checkedIn: queue.totalCheckedIn,
    completed: queue.totalCompleted,
    notCompleted: queue.totalNotCompleted,
  };
}

export function buildFeedbackSectionFromDailyStats(
  aggregated: DailyRequestStats,
): AdminFeedbackSection {
  return {
    total: aggregated.complaints + aggregated.proposals,
    newCount: aggregated.complaintNew + aggregated.proposalNew,
  };
}

export function buildFeedbackSectionFromRequests(
  requests: OfficeRequest[],
): AdminFeedbackSection {
  const feedback = requests.filter(
    (r) => r.type === "complaint" || r.type === "proposal",
  );
  return {
    total: feedback.length,
    newCount: feedback.filter((r) => r.status === "new").length,
  };
}

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

function buildTimelineWeeksFromDailyRows(
  rows: DailyRequestStats[],
  options?: { timelineDays?: number },
): { weekStart: string; count: number }[] {
  const timelineDays = options?.timelineDays ?? 90;
  const cutoff = Date.now() - timelineDays * 24 * 60 * 60 * 1000;
  const weekCounts = new Map<string, number>();

  for (const row of rows) {
    const created = Date.parse(`${row.date}T12:00:00.000Z`);
    if (Number.isNaN(created) || created < cutoff) continue;
    const weekStart = formatDay(startOfWeekUtc(new Date(created)));
    weekCounts.set(weekStart, (weekCounts.get(weekStart) ?? 0) + row.totalRequests);
  }

  return [...weekCounts.keys()]
    .sort()
    .map((weekStart) => ({
      weekStart,
      count: weekCounts.get(weekStart) ?? 0,
    }));
}

/** Aggregated daily_request_stats → dashboard analytics (fast path). */
export function buildAdminAnalyticsFromAggregatedDailyStats(
  aggregated: DailyRequestStats,
  dailyRows?: DailyRequestStats[],
  options?: { timelineDays?: number },
): AdminRequestAnalytics {
  return {
    byStatus: {
      new: aggregated.new,
      in_progress: aggregated.inProgress,
      contacted: 0,
      completed: aggregated.completed,
      cancelled: aggregated.cancelled,
    },
    byType: {
      booking: aggregated.bookings,
      complaint: aggregated.complaints,
      proposal: aggregated.proposals,
    },
    timelineWeeks: dailyRows
      ? buildTimelineWeeksFromDailyRows(dailyRows, options)
      : [],
  };
}

/** @deprecated Use buildAdminAnalyticsFromAggregatedDailyStats */
export function buildAdminAnalyticsFromDailyStats(
  stats: DailyRequestStats,
): AdminRequestAnalytics {
  return buildAdminAnalyticsFromAggregatedDailyStats(stats);
}

export function buildQueueDailyAnalyticsSummary(
  rows: {
    totalCheckedIn: number;
    totalCompleted: number;
    totalNoShow: number;
  }[],
): QueueDailyAnalyticsSummary {
  return rows.reduce(
    (acc, row) => ({
      totalCheckedIn: acc.totalCheckedIn + row.totalCheckedIn,
      totalCompleted: acc.totalCompleted + row.totalCompleted,
      totalNoShow: acc.totalNoShow + row.totalNoShow,
    }),
    { totalCheckedIn: 0, totalCompleted: 0, totalNoShow: 0 },
  );
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

export function buildOfficePerformanceRatings(
  requests: OfficeRequest[],
  offices: Pick<Office, "id" | "nameAr">[],
): OfficePerformanceRating[] {
  const byOffice = new Map<string, OfficePerformanceRating>();

  for (const office of offices) {
    byOffice.set(office.id, {
      officeId: office.id,
      officeNameAr: office.nameAr,
      bookings: 0,
      complaints: 0,
      proposals: 0,
      completed: 0,
    });
  }

  for (const request of requests) {
    const existing = byOffice.get(request.officeId);
    const rating =
      existing ??
      {
        officeId: request.officeId,
        officeNameAr: request.officeNameAr || request.officeId,
        bookings: 0,
        complaints: 0,
        proposals: 0,
        completed: 0,
      };

    if (request.type === "booking") {
      rating.bookings += 1;
      if (request.status === "completed") rating.completed += 1;
    } else if (request.type === "proposal") {
      rating.proposals += 1;
    } else {
      rating.complaints += 1;
    }
    byOffice.set(rating.officeId, rating);
  }

  return sortOfficePerformanceRatings([...byOffice.values()]);
}

export function buildOfficePerformanceFromDailyStats(
  rows: DailyRequestStats[],
  offices: Pick<Office, "id" | "nameAr">[],
): OfficePerformanceRating[] {
  const byOffice = new Map<string, OfficePerformanceRating>();

  for (const office of offices) {
    byOffice.set(office.id, {
      officeId: office.id,
      officeNameAr: office.nameAr,
      bookings: 0,
      complaints: 0,
      proposals: 0,
      completed: 0,
    });
  }

  for (const row of rows) {
    const existing = byOffice.get(row.officeId);
    const rating =
      existing ??
      {
        officeId: row.officeId,
        officeNameAr: row.officeId,
        bookings: 0,
        complaints: 0,
        proposals: 0,
        completed: 0,
      };

    rating.bookings += row.bookings;
    rating.complaints += row.complaints;
    rating.proposals += row.proposals;
    rating.completed += row.bookingCompleted;
    byOffice.set(rating.officeId, rating);
  }

  return sortOfficePerformanceRatings([...byOffice.values()]);
}

export type TopOfficeChartRow = {
  officeId: string;
  officeNameAr: string;
  count: number;
};

function truncateOfficeLabel(name: string, maxLength = 28): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

export function topOfficesByTotalRequests(
  ratings: OfficePerformanceRating[],
  limit = 10,
): TopOfficeChartRow[] {
  return [...ratings]
    .map((rating) => ({
      officeId: rating.officeId,
      officeNameAr: truncateOfficeLabel(rating.officeNameAr),
      count: rating.bookings + rating.complaints + rating.proposals,
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.officeNameAr.localeCompare(b.officeNameAr, "ar");
    })
    .slice(0, limit);
}

export function topOfficesByComplaints(
  ratings: OfficePerformanceRating[],
  limit = 10,
): TopOfficeChartRow[] {
  return [...ratings]
    .map((rating) => ({
      officeId: rating.officeId,
      officeNameAr: truncateOfficeLabel(rating.officeNameAr),
      count: rating.complaints,
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.officeNameAr.localeCompare(b.officeNameAr, "ar");
    })
    .slice(0, limit);
}
