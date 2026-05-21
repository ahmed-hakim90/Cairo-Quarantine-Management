import { getCairoTodayYmd } from "@/lib/cairo-today-ymd";
import { parseAdminBookingDateParams } from "@/lib/office-requests/admin-booking-date-range";
import {
  aggregateDailyRequestStats,
  listDailyRequestStatsForOffices,
} from "@/lib/office-requests/daily-request-stats";
import {
  buildAdminAnalyticsFromAggregatedDailyStats,
  buildAdminRequestAnalytics,
  buildBookingQueueSection,
  buildFeedbackSectionFromDailyStats,
  buildFeedbackSectionFromRequests,
  buildOfficePerformanceRatings,
} from "@/lib/office-requests/analytics";
import { adminAllowedOfficeIds } from "@/lib/office-requests/admin-access";
import { getAdminSession } from "@/lib/office-requests/session";
import {
  countVisibleBookingsForSession,
  listOffices,
  listRequestsForSession,
} from "@/lib/office-requests/store";
import {
  aggregateDailyQueueStats,
  listDailyQueueStatsForOfficesInRange,
} from "@/lib/queue/daily-stats-service";
import { noStoreJson } from "@/lib/security/admin-request";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return noStoreJson({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dateParams = parseAdminBookingDateParams({
    rawRange: url.searchParams.get("range") ?? undefined,
    rawFrom: url.searchParams.get("from") ?? undefined,
    rawTo: url.searchParams.get("to") ?? undefined,
  });

  const isSuperAdmin = session.profile.role === "super_admin";
  const allOffices = await listOffices({ includeInactive: isSuperAdmin });
  const allowedOfficeIds = adminAllowedOfficeIds(session.profile);
  const offices = isSuperAdmin
    ? allOffices
    : allOffices.filter((o) => allowedOfficeIds.includes(o.id));

  const rawOfficeId = url.searchParams.get("officeId")?.trim();
  let officeFilter: string | undefined;
  if (isSuperAdmin && rawOfficeId) {
    if (!offices.some((o) => o.id === rawOfficeId)) {
      return noStoreJson({ error: "office_not_found" }, { status: 404 });
    }
    officeFilter = rawOfficeId;
  }

  const bookingDateRange = dateParams.bookingDateRange;
  const applyBookingDateFilter = bookingDateRange != null;

  const statsOfficeIds = officeFilter
    ? [officeFilter]
    : offices.map((o) => o.id);
  const statsFrom = bookingDateRange?.fromYmd ?? "2020-01-01";
  const statsTo = bookingDateRange?.toYmd ?? getCairoTodayYmd();

  const sessionListArgs = {
    role: session.profile.role,
    officeId: session.profile.officeId,
    allowedOfficeIds: session.profile.allowedOfficeIds,
    ...(officeFilter ? { officeFilter } : {}),
    ...(applyBookingDateFilter && bookingDateRange
      ? {
          adminBookingTodayYmd: getCairoTodayYmd(),
          bookingDateFrom: bookingDateRange.fromYmd,
          bookingDateTo: bookingDateRange.toYmd,
        }
      : {}),
  };

  const [requests, dailyStatsRows, queueStatsRows, bookingCount] =
    await Promise.all([
      listRequestsForSession(sessionListArgs),
      listDailyRequestStatsForOffices({
        officeIds: statsOfficeIds,
        fromDate: statsFrom,
        toDate: statsTo,
      }),
      listDailyQueueStatsForOfficesInRange({
        officeIds: statsOfficeIds,
        fromDate: statsFrom,
        toDate: statsTo,
      }),
      applyBookingDateFilter && bookingDateRange
        ? countVisibleBookingsForSession({
            role: session.profile.role,
            officeId: session.profile.officeId,
            allowedOfficeIds: session.profile.allowedOfficeIds,
            ...(officeFilter ? { officeFilter } : {}),
            adminBookingTodayYmd: getCairoTodayYmd(),
            bookingDateFrom: bookingDateRange.fromYmd,
            bookingDateTo: bookingDateRange.toYmd,
          })
        : Promise.resolve(null),
    ]);

  const aggregatedStats = aggregateDailyRequestStats(dailyStatsRows);
  const useDailyStatsPath =
    !applyBookingDateFilter && aggregatedStats.totalRequests > 0;

  const analytics = useDailyStatsPath
    ? buildAdminAnalyticsFromAggregatedDailyStats(
        aggregatedStats,
        dailyStatsRows,
      )
    : buildAdminRequestAnalytics(requests);

  const queueAggregated = aggregateDailyQueueStats(queueStatsRows);
  const totalBookings = applyBookingDateFilter
    ? (bookingCount ?? 0)
    : aggregatedStats.bookings;
  const bookingQueue = buildBookingQueueSection(totalBookings, queueAggregated);
  const feedback = useDailyStatsPath
    ? buildFeedbackSectionFromDailyStats(aggregatedStats)
    : buildFeedbackSectionFromRequests(requests);

  const officeRatings = buildOfficePerformanceRatings(
    requests,
    officeFilter
      ? offices.filter((o) => o.id === officeFilter)
      : offices,
  );

  return noStoreJson({
    generatedAt: new Date().toISOString(),
    filters: {
      officeId: officeFilter ?? null,
      bookingDateRange: bookingDateRange ?? null,
      dataSource: useDailyStatsPath ? "daily_request_stats" : "requests",
    },
    summary: {
      totalRequests: applyBookingDateFilter
        ? requests.length
        : aggregatedStats.totalRequests > 0
          ? aggregatedStats.totalRequests
          : requests.length,
      byType: analytics.byType,
    },
    bookingQueue,
    feedback,
    timelineWeeks: analytics.timelineWeeks,
    officePerformance: officeRatings,
  });
}
