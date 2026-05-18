import type { DailyRequestStats } from "@/lib/office-requests/daily-request-stats";
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

export function buildAdminAnalyticsFromDailyStats(
  stats: DailyRequestStats,
): AdminRequestAnalytics {
  return {
    byStatus: {
      new: stats.new,
      in_progress: stats.inProgress,
      contacted: 0,
      completed: stats.completed,
      cancelled: stats.cancelled,
    },
    byType: {
      booking: stats.bookings,
      complaint: stats.complaints,
      proposal: stats.proposals,
    },
    timelineWeeks: [],
  };
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
      };

    if (request.type === "booking") {
      rating.bookings += 1;
    } else {
      rating.complaints += 1;
    }
    byOffice.set(rating.officeId, rating);
  }

  const ratings = [...byOffice.values()];

  ratings.sort((a, b) => {
    const aTotal = a.bookings + a.complaints;
    const bTotal = b.bookings + b.complaints;
    if (aTotal !== bTotal) return bTotal - aTotal;
    if (a.bookings !== b.bookings) return b.bookings - a.bookings;
    return a.officeNameAr.localeCompare(b.officeNameAr, "ar");
  });

  return ratings;
}
