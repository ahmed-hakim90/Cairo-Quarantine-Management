import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AdminAnalyticsCharts } from "@/components/admin/AdminAnalyticsCharts";
import { AdminDashboardPeriodFilter } from "@/components/admin/AdminDashboardPeriodFilter";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { SuperAdminDashboardOfficeFilter } from "@/components/admin/SuperAdminDashboardOfficeFilter";
import { SuperAdminExportLauncher } from "@/components/admin/SuperAdminExportLauncher";
import { getCairoTodayYmd } from "@/lib/cairo-today-ymd";
import { isLocale } from "@/lib/i18n/config";
import { parseAdminBookingDateParams } from "@/lib/office-requests/admin-booking-date-range";
import {
  aggregateDailyRequestStats,
  listDailyRequestStatsForOffices,
} from "@/lib/office-requests/daily-request-stats";
import {
  buildAdminRequestAnalytics,
  buildOfficePerformanceRatings,
} from "@/lib/office-requests/analytics";
import { adminAllowedOfficeIds } from "@/lib/office-requests/admin-access";
import { getAdminSession } from "@/lib/office-requests/session";
import {
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

  const [requests, dailyStatsRows, travelerStates] = await Promise.all([
    listRequestsForSession({
      role: session.profile.role,
      officeId: session.profile.officeId,
      allowedOfficeIds: session.profile.allowedOfficeIds,
      ...(officeFilter ? { officeFilter } : {}),
      ...(applyBookingDateFilter
        ? {
            adminBookingTodayYmd: getCairoTodayYmd(),
            bookingDateFrom: bookingDateRange.fromYmd,
            bookingDateTo: bookingDateRange.toYmd,
          }
        : {}),
    }),
    listDailyRequestStatsForOffices({
      officeIds: statsOfficeIds,
      fromDate: statsFrom,
      toDate: statsTo,
    }),
    listTravelerStates({ includeInactive: true }),
  ]);

  const aggregatedStats = aggregateDailyRequestStats(dailyStatsRows);
  const analytics = buildAdminRequestAnalytics(requests);
  const totalRequestsValue = applyBookingDateFilter
    ? requests.length
    : aggregatedStats.totalRequests > 0
      ? aggregatedStats.totalRequests
      : requests.length;
  const officeRatings = buildOfficePerformanceRatings(
    requests,
    selectedOfficeId
      ? offices.filter((office) => office.id === selectedOfficeId)
      : offices,
  );

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
              <Suspense
                fallback={
                  <div
                    className="flex min-w-0 w-full max-w-full flex-col gap-1"
                    aria-hidden
                  >
                    <div className="h-3 w-28 max-w-full rounded bg-gov-gray-100 animate-pulse" />
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <div className="h-10 min-w-0 flex-1 rounded-md bg-gov-gray-100 animate-pulse" />
                      <div className="h-10 w-[7.5rem] shrink-0 rounded-md bg-gov-gray-100 animate-pulse" />
                    </div>
                  </div>
                }
              >
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
        <Suspense
          fallback={
            <div
              className="mt-4 border-t border-gov-gray-100 pt-4"
              aria-hidden
            >
              <div className="mb-2 h-3 w-40 rounded bg-gov-gray-100 animate-pulse" />
              <div className="h-10 w-full max-w-md rounded-md bg-gov-gray-100 animate-pulse" />
            </div>
          }
        >
          <AdminDashboardPeriodFilter
            locale={locale}
            dateRange={dateParams.dateRange}
            customDateFrom={dateParams.customDateFrom}
            customDateTo={dateParams.customDateTo}
          />
        </Suspense>
      </div>

      <div className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <AdminStatCard
          label={
            applyBookingDateFilter
              ? "إجمالي الطلبات (في النطاق)"
              : "إجمالي الطلبات"
          }
          value={totalRequestsValue}
        />
        <AdminStatCard label="جديد" value={analytics.byStatus.new} />
        <AdminStatCard
          label="قيد المتابعة"
          value={analytics.byStatus.in_progress}
        />
        <AdminStatCard label="تم التواصل" value={analytics.byStatus.contacted} />
        <AdminStatCard label="مكتمل" value={analytics.byStatus.completed} />
        <AdminStatCard label="ملغي" value={analytics.byStatus.cancelled} />
        {selectedOfficeNameAr ? (
          <AdminStatCard label="المكتب" value={selectedOfficeNameAr} />
        ) : (
          <AdminStatCard label="المكاتب المتاحة" value={offices.length} />
        )}
      </div>

      <div className="mb-6">
        <AdminAnalyticsCharts analytics={analytics} />
      </div>

      <section className="mb-6 rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-extrabold text-gov-navy">
              تقييم أداء المكاتب
            </h2>
            <p className="mt-1 text-xs text-gov-gray-600">
              عدد الحجوزات والشكاوى المسجلة لكل مكتب، ويشمل الحجوزات السابقة
              والقادمة.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-gov-gray-50 text-xs font-bold uppercase text-gov-gray-600">
              <tr>
                <th className="px-4 py-3">المكتب</th>
                <th className="px-4 py-3">حجوزات</th>
                <th className="px-4 py-3">شكاوى</th>
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
                    {rating.complaints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
