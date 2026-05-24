import { notFound, redirect } from "next/navigation";
import { AdminRequestsTable } from "@/components/admin/AdminRequestsTable";
import { RequestsExcelQuickExport } from "@/components/admin/RequestsExcelQuickExport";
import { SuperAdminExportLauncher } from "@/components/admin/SuperAdminExportLauncher";
import { getCairoTodayYmd } from "@/lib/cairo-today-ymd";
import { isLocale } from "@/lib/i18n/config";
import { adminAllowedOfficeIds, isSingleOfficeStaffRole } from "@/lib/office-requests/admin-access";
import {
  isExplicitBookingDateFilter,
  parseAdminBookingDateParams,
} from "@/lib/office-requests/admin-booking-date-range";
import {
  cursorForAdminRequestsPage,
  parseAdminRequestsCursors,
  parseAdminRequestsPage,
  parseAdminRequestsSort,
  parseAdminRequestsStatus,
  sortToFirestore,
} from "@/lib/office-requests/requests-list-params";
import { getAdminSession } from "@/lib/office-requests/session";
import {
  countVisibleBookingsForSession,
  listLatestActivityLogByRequestIds,
  listOffices,
  listRequestsForSessionPage,
  searchRequestsForSessionPage,
  listTravelerStates,
} from "@/lib/office-requests/store";
import type { AdminRequestsDateRange } from "@/components/admin/AdminRequestsTable";

export const dynamic = "force-dynamic";

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  const first = value?.[0];
  return typeof first === "string" ? first.trim() || undefined : undefined;
}

export default async function AdminRequestsPage({
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
  const isReception = session.profile.role === "office_reception";
  const isLocalAdmin =
    session.profile.role === "office_admin" ||
    session.profile.role === "governorate_admin";

  const sp = (await searchParams) ?? {};
  const dateParams = parseAdminBookingDateParams({
    rawRange: firstSearchParam(sp.range),
    rawFrom: firstSearchParam(sp.from),
    rawTo: firstSearchParam(sp.to),
  });
  if (dateParams.invalid) {
    redirect(`/${locale}/admin/requests`);
  }

  const legacyCursor = firstSearchParam(sp.cursor);
  let currentPage = parseAdminRequestsPage(firstSearchParam(sp.page));
  let pageCursors = parseAdminRequestsCursors(firstSearchParam(sp.cursors));
  if (legacyCursor && pageCursors.length === 0) {
    currentPage = Math.max(currentPage, 2);
    pageCursors = [legacyCursor];
  }
  const listCursor = cursorForAdminRequestsPage(currentPage, pageCursors);
  if (currentPage > 1 && !listCursor) {
    redirect(`/${locale}/admin/requests`);
  }

  const q = firstSearchParam(sp.q) ?? "";
  const statusFilter = parseAdminRequestsStatus(firstSearchParam(sp.status));
  const sort = parseAdminRequestsSort(firstSearchParam(sp.sort));
  const dateRange = dateParams.dateRange as AdminRequestsDateRange;
  const bookingDateRange = dateParams.bookingDateRange;

  const { sortKey, sortDirection } = sortToFirestore(sort);
  const todayYmd = getCairoTodayYmd();

  const listArgs = {
    role: session.profile.role,
    officeId: session.profile.officeId,
    allowedOfficeIds: session.profile.allowedOfficeIds,
    adminBookingTodayYmd: todayYmd,
    bookingDateFrom: bookingDateRange?.fromYmd,
    bookingDateTo: bookingDateRange?.toYmd,
  };

  const allOffices =
    isSuperAdmin || isLocalAdmin
      ? await listOffices({ includeInactive: isSuperAdmin })
      : [];
  const visibleOffices = isLocalAdmin
    ? allOffices.filter((office) =>
        adminAllowedOfficeIds(session.profile).includes(office.id),
      )
    : allOffices;

  const explicitDateFilter = isExplicitBookingDateFilter({
    dateRange,
    hasCustomRange: dateParams.hasCustomRange,
  });

  const requestListPromise = q
    ? searchRequestsForSessionPage({
        ...listArgs,
        q,
        status: statusFilter === "all" ? undefined : statusFilter,
        sortKey,
        sortDirection,
      })
    : listRequestsForSessionPage({
        ...listArgs,
        status: statusFilter === "all" ? undefined : statusFilter,
        sortKey,
        sortDirection,
        cursor: listCursor,
      });

  const bookingCountPromise =
    explicitDateFilter && bookingDateRange
      ? countVisibleBookingsForSession(listArgs)
      : Promise.resolve(null);

  const [requestPage, travelerStates, totalBookingsInPeriod] =
    await Promise.all([
      requestListPromise,
      listTravelerStates({ includeInactive: true }),
      bookingCountPromise,
    ]);
  const requests = requestPage.items;

  const latestActivityByRequestId = await listLatestActivityLogByRequestIds(
    requests.map((r) => r.id),
  );

  const requestsHref = `/${locale}/admin/requests`;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gov-navy">الطلبات</h1>
            <p className="mt-2 text-sm text-gov-gray-600">
              {isReception
                ? "عرض وتصفية حجوزات المكتب."
                : "عرض وتصفية طلبات الحجز والشكاوى والمقترحات."}
            </p>
          </div>
          {isSuperAdmin || isLocalAdmin || session.profile.officeId ? (
            <div className="flex shrink-0 flex-wrap items-start justify-end gap-3 sm:pt-1">
              <RequestsExcelQuickExport
                status={statusFilter}
                bookingDateFrom={bookingDateRange?.fromYmd}
                bookingDateTo={bookingDateRange?.toYmd}
                lockedOfficeId={
                  isSingleOfficeStaffRole(session.profile.role)
                    ? session.profile.officeId
                    : null
                }
              />
              <SuperAdminExportLauncher
                offices={visibleOffices}
                lockedOfficeId={
                  isSingleOfficeStaffRole(session.profile.role)
                    ? session.profile.officeId
                    : null
                }
                travelerStates={travelerStates}
              />
            </div>
          ) : null}
        </div>
      </div>
      <AdminRequestsTable
        requests={requests}
        locale={locale}
        travelerStates={travelerStates}
        requestsListHref={requestsHref}
        statusFilter={statusFilter}
        sort={sort}
        searchQuery={q}
        dateRange={dateRange}
        customDateFrom={dateParams.customDateFrom}
        customDateTo={dateParams.customDateTo}
        latestActivityByRequestId={latestActivityByRequestId}
        nextCursor={requestPage.nextCursor}
        totalBookingsInPeriod={totalBookingsInPeriod}
        currentPage={q ? 1 : currentPage}
        pageCursors={q ? [] : pageCursors}
        bookingsOnly={isReception}
      />
    </div>
  );
}
