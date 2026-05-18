import { notFound, redirect } from "next/navigation";
import { AdminRequestsTable } from "@/components/admin/AdminRequestsTable";
import { SuperAdminExportLauncher } from "@/components/admin/SuperAdminExportLauncher";
import { getCairoTodayYmd } from "@/lib/cairo-today-ymd";
import { isLocale } from "@/lib/i18n/config";
import { adminAllowedOfficeIds } from "@/lib/office-requests/admin-access";
import { parseAdminBookingDateParams } from "@/lib/office-requests/admin-booking-date-range";
import {
  parseAdminRequestsSort,
  parseAdminRequestsStatus,
  sortToFirestore,
} from "@/lib/office-requests/requests-list-params";
import { getAdminSession } from "@/lib/office-requests/session";
import {
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

  const cursor = firstSearchParam(sp.cursor);
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
        cursor,
      });

  const [requestPage, travelerStates] = await Promise.all([
    requestListPromise,
    listTravelerStates({ includeInactive: true }),
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
              عرض وتصفية طلبات الحجز والشكاوى والمقترحات.
            </p>
          </div>
          {isSuperAdmin ? (
            <div className="shrink-0 sm:pt-1">
              <SuperAdminExportLauncher
                offices={visibleOffices}
                travelerStates={travelerStates}
              />
            </div>
          ) : isLocalAdmin ? (
            <div className="shrink-0 sm:pt-1">
              <SuperAdminExportLauncher
                offices={visibleOffices}
                travelerStates={travelerStates}
              />
            </div>
          ) : session.profile.officeId ? (
            <div className="shrink-0 sm:pt-1">
              <SuperAdminExportLauncher
                lockedOfficeId={session.profile.officeId}
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
      />
    </div>
  );
}
