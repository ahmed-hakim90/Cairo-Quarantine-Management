import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AdminAnalyticsCharts } from "@/components/admin/AdminAnalyticsCharts";
import { AdminTopOfficesCharts } from "@/components/admin/AdminTopOfficesCharts";
import { AdminBookingQueueStatSection } from "@/components/admin/AdminBookingQueueStatSection";
import { AdminDashboardPeriodFilter } from "@/components/admin/AdminDashboardPeriodFilter";
import { AdminFeedbackStatSection } from "@/components/admin/AdminFeedbackStatSection";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { SuperAdminDashboardOfficeFilter } from "@/components/admin/SuperAdminDashboardOfficeFilter";
import { SuperAdminExportLauncher } from "@/components/admin/SuperAdminExportLauncher";
import {
  AdminDashboardOfficeFilterSkeleton,
  AdminDashboardPeriodFilterSkeleton,
} from "@/components/skeletons/admin/AdminDashboardFilterSkeleton";
import { getCairoTodayYmd } from "@/lib/cairo-today-ymd";
import { isLocale } from "@/lib/i18n/config";
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
  buildOfficePerformanceFromDailyStats,
  topOfficesByComplaints,
  topOfficesByTotalRequests,
} from "@/lib/office-requests/analytics";
import {
  aggregateDailyQueueStats,
  listDailyQueueStatsForOfficesInRange,
} from "@/lib/queue/daily-stats-service";
import { adminAllowedOfficeIds, canViewFeedbackRequests, canViewTopOfficesDashboardCharts } from "@/lib/office-requests/admin-access";
import { getAdminSession } from "@/lib/office-requests/session";
import {
  countVisibleBookingsForSession,
  listOffices,
  listRequestsForSession,
  listTravelerStates,
} from "@/lib/office-requests/store";

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  const first = value?.[0];
  return typeof first === "string" ? first.trim() || undefined : undefined;
}

export default async function AdminOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);

  const isSuperAdmin = session.profile.role === "super_admin";
  const isReception = !canViewFeedbackRequests(session.profile.role);
  const showTopOfficesCharts = canViewTopOfficesDashboardCharts(session.profile.role);
  const isLocalAdmin =
    session.profile.role === "office_admin" ||
    session.profile.role === "governorate_admin";
  const allOffices = await listOffices({ includeInactive: isSuperAdmin });
  const allowedOfficeIds = adminAllowedOfficeIds(session.profile);
  const offices = isSuperAdmin
    ? allOffices
    : allOffices.filter((office) => allowedOfficeIds.includes(office.id));

  const sp = (await searchParams) ?? {};
  const rawOfficeId = firstSearchParam(sp.officeId);

  let officeFilter: string | undefined;
  let selectedOfficeId: string | null = null;
  let selectedOfficeNameAr: string | null = null;

  if (isSuperAdmin && rawOfficeId) {
    const match = offices.find((o) => o.id === rawOfficeId);
    if (match) {
      officeFilter = match.id;
      selectedOfficeId = match.id;
      selectedOfficeNameAr = match.nameAr;
    } else {
      redirect(`/${locale}/admin`);
    }
  }

  const dateParams = parseAdminBookingDateParams({
    rawRange: firstSearchParam(sp.range),
    rawFrom: firstSearchParam(sp.from),
    rawTo: firstSearchParam(sp.to),
  });
  if (dateParams.invalid) {
    const u = new URLSearchParams();
    if (selectedOfficeId) u.set("officeId", selectedOfficeId);
    const qs = u.toString();
    redirect(qs ? `/${locale}/admin?${qs}` : `/${locale}/admin`);
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

  const [requests, dailyStatsRows, queueStatsRows, travelerStates, bookingCount] =
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
      listTravelerStates({ includeInactive: true }),
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
  const bookingSection = buildBookingQueueSection(
    totalBookings,
    queueAggregated,
  );
  const feedbackSection = useDailyStatsPath
    ? buildFeedbackSectionFromDailyStats(aggregatedStats)
    : buildFeedbackSectionFromRequests(requests);
  const scopedOffices = selectedOfficeId
    ? offices.filter((office) => office.id === selectedOfficeId)
    : offices;
  const officeRatings =
    dailyStatsRows.length > 0
      ? buildOfficePerformanceFromDailyStats(dailyStatsRows, scopedOffices)
      : buildOfficePerformanceRatings(requests, scopedOffices);
  const topByRequests = topOfficesByTotalRequests(officeRatings);
  const topByComplaints = topOfficesByComplaints(officeRatings);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gov-navy">
              التحكم والتحليلات
            </h1>
            <p className="mt-2 text-sm text-gov-gray-600">
              نظرة عامة على الطلبات والاتجاهات. مرحباً{" "}
              {session.profile.displayName}.
            </p>
          </div>
          <div className="flex min-w-0 w-full shrink-0 flex-col gap-4 sm:max-w-xl sm:items-end">
            {isSuperAdmin ? (
              <Suspense fallback={<AdminDashboardOfficeFilterSkeleton />}>
                <SuperAdminDashboardOfficeFilter
                  locale={locale}
                  offices={offices}
                  selectedOfficeId={selectedOfficeId}
                  trailingActions={
                    <SuperAdminExportLauncher
                      offices={offices}
                      travelerStates={travelerStates}
                    />
                  }
                />
              </Suspense>
            ) : isLocalAdmin ? (
              <div className="sm:pt-1">
                <SuperAdminExportLauncher
                  offices={offices}
                  travelerStates={travelerStates}
                />
              </div>
            ) : session.profile.officeId ? (
              <div className="sm:pt-1">
                <SuperAdminExportLauncher
                  lockedOfficeId={session.profile.officeId}
                  travelerStates={travelerStates}
                />
              </div>
            ) : null}
          </div>
        </div>
        <Suspense fallback={<AdminDashboardPeriodFilterSkeleton />}>
          <AdminDashboardPeriodFilter
            locale={locale}
            dateRange={dateParams.dateRange}
            customDateFrom={dateParams.customDateFrom}
            customDateTo={dateParams.customDateTo}
          />
        </Suspense>
      </div>

      <div className="space-y-8 py-6">
        <AdminBookingQueueStatSection
          title="الحجوزات"
          totalLabel={
            applyBookingDateFilter ? "إجمالي الحجوزات (في النطاق)" : "إجمالي الحجوزات"
          }
          section={bookingSection}
        />
        {!isReception ? (
          <AdminFeedbackStatSection
            title="الشكاوى والمقترحات"
            totalLabel={
              applyBookingDateFilter
                ? "إجمالي الشكاوى والمقترحات (في النطاق)"
                : "إجمالي الشكاوى والمقترحات"
            }
            section={feedbackSection}
          />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {selectedOfficeNameAr ? (
            <AdminStatCard label="المكتب" value={selectedOfficeNameAr} />
          ) : (
            <AdminStatCard label="المكاتب المتاحة" value={offices.length} />
          )}
        </div>
      </div>

      <div className="mb-6">
        <AdminAnalyticsCharts
          analytics={analytics}
          bookingQueue={bookingSection}
          feedback={feedbackSection}
          showFeedback={!isReception}
        />
      </div>

      {showTopOfficesCharts ? (
        <div className="mb-6">
          <AdminTopOfficesCharts
            topByRequests={topByRequests}
            topByComplaints={topByComplaints}
            showComplaints={!isReception}
          />
        </div>
      ) : null}

      <section className="mb-6 rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-extrabold text-gov-navy">
              تقييم أداء المكاتب
            </h2>
            <p className="mt-1 text-xs text-gov-gray-600">
              {isReception
                ? "حجوزات ضمن النطاق المفلتر."
                : "حجوزات وشكاوى ضمن النطاق المفلتر."}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-gov-gray-50 text-xs font-bold uppercase text-gov-gray-600">
              <tr>
                <th className="px-4 py-3">المكتب</th>
                <th className="px-4 py-3">حجوزات</th>
                <th className="px-4 py-3">مكتمل</th>
                {!isReception ? <th className="px-4 py-3">شكاوى</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-gray-100">
              {officeRatings.map((rating) => (
                <tr key={rating.officeId} className="align-middle">
                  <td className="px-4 py-3 font-bold text-gov-navy">
                    {rating.officeNameAr}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gov-gray-800">
                    {rating.bookings}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gov-gray-800">
                    {rating.completed}
                  </td>
                  {!isReception ? (
                    <td className="px-4 py-3 font-semibold text-gov-gray-800">
                      {rating.complaints}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
