import { notFound, redirect } from "next/navigation";
import type { Timestamp } from "firebase-admin/firestore";
import { AdminRequestsTable } from "@/components/admin/AdminRequestsTable";
import { SuperAdminExportLauncher } from "@/components/admin/SuperAdminExportLauncher";
import { getCairoTodayYmd, getCairoYesterdayYmd } from "@/lib/cairo-today-ymd";
import { isLocale } from "@/lib/i18n/config";
import { adminAllowedOfficeIds } from "@/lib/office-requests/admin-access";
import { parseExportCreatedBounds } from "@/lib/office-requests/export-date-bounds";
import {
  coerceSortForUpdatedWindow,
  parseAdminRequestsSort,
  parseAdminRequestsStatus,
  sortToFirestore,
} from "@/lib/office-requests/requests-list-params";
import { getAdminSession } from "@/lib/office-requests/session";
import {
  listLatestActivityLogByRequestIds,
  listOffices,
  listRequestsForSessionPage,
  listTravelerStates,
} from "@/lib/office-requests/store";
import type { AdminRequestsDateRange } from "@/components/admin/AdminRequestsTable";

export const dynamic = "force-dynamic";

const REQUEST_DATE_RANGES = new Set<string>([
  "all",
  "today",
  "yesterday",
  "today_yesterday",
]);

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  const first = value?.[0];
  return typeof first === "string" ? first.trim() || undefined : undefined;
}

function resolveUpdatedBounds(
  dateRange: AdminRequestsDateRange,
): { updatedFrom: Timestamp; updatedTo: Timestamp } | null {
  if (dateRange === "all") return null;

  const todayYmd = getCairoTodayYmd();
  const yesterdayYmd = getCairoYesterdayYmd();
  let fromYmd: string;
  let toYmd: string;
  if (dateRange === "today") {
    fromYmd = todayYmd;
    toYmd = todayYmd;
  } else if (dateRange === "yesterday") {
    fromYmd = yesterdayYmd;
    toYmd = yesterdayYmd;
  } else {
    fromYmd = yesterdayYmd;
    toYmd = todayYmd;
  }

  const parsed = parseExportCreatedBounds(fromYmd, toYmd);
  if ("error" in parsed) return null;
  if (parsed.createdFrom && parsed.createdTo) {
    return { updatedFrom: parsed.createdFrom, updatedTo: parsed.createdTo };
  }
  return null;
}

function resolveCustomUpdatedBounds(
  fromRaw: string | undefined,
  toRaw: string | undefined,
): {
  bounds: { updatedFrom: Timestamp; updatedTo: Timestamp };
  fromYmd: string;
  toYmd: string;
} | null {
  const from = fromRaw?.trim() || undefined;
  const to = toRaw?.trim() || undefined;
  if (!from && !to) return null;

  const fromYmd = from ?? to;
  const toYmd = to ?? from;
  if (!fromYmd || !toYmd) return null;

  const parsed = parseExportCreatedBounds(fromYmd, toYmd);
  if ("error" in parsed) return null;
  if (parsed.createdFrom && parsed.createdTo) {
    return {
      bounds: { updatedFrom: parsed.createdFrom, updatedTo: parsed.createdTo },
      fromYmd,
      toYmd,
    };
  }
  return null;
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
  const isOfficeAdmin = session.profile.role === "office_admin";

  const sp = (await searchParams) ?? {};
  const rawFrom = firstSearchParam(sp.from);
  const rawTo = firstSearchParam(sp.to);
  const hasCustomRange = Boolean(rawFrom || rawTo);
  const customRange = resolveCustomUpdatedBounds(rawFrom, rawTo);
  if (hasCustomRange && !customRange) {
    redirect(`/${locale}/admin/requests`);
  }

  const rawRange = firstSearchParam(sp.range);
  const cursor = firstSearchParam(sp.cursor);
  const statusFilter = parseAdminRequestsStatus(firstSearchParam(sp.status));
  const sort = parseAdminRequestsSort(firstSearchParam(sp.sort));
  const dateRange: AdminRequestsDateRange =
    !hasCustomRange && rawRange && REQUEST_DATE_RANGES.has(rawRange)
      ? (rawRange as AdminRequestsDateRange)
      : "all";

  const updatedBounds = customRange?.bounds ?? resolveUpdatedBounds(dateRange);
  if (dateRange !== "all" && !updatedBounds) {
    redirect(`/${locale}/admin/requests`);
  }

  const effectiveSort = coerceSortForUpdatedWindow(
    sort,
    updatedBounds != null,
  );
  const { sortKey, sortDirection } = sortToFirestore(effectiveSort);

  const listArgs = {
    role: session.profile.role,
    officeId: session.profile.officeId,
    allowedOfficeIds: session.profile.allowedOfficeIds,
    ...(updatedBounds ?? {}),
  };

  const allOffices =
    isSuperAdmin || isOfficeAdmin
      ? await listOffices({ includeInactive: isSuperAdmin })
      : [];
  const visibleOffices = isOfficeAdmin
    ? allOffices.filter((office) =>
        adminAllowedOfficeIds(session.profile).includes(office.id),
      )
    : allOffices;

  const [requestPage, travelerStates] = await Promise.all([
    listRequestsForSessionPage({
      ...listArgs,
      status: statusFilter === "all" ? undefined : statusFilter,
      sortKey,
      sortDirection,
      cursor,
    }),
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
          ) : isOfficeAdmin ? (
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
        sort={effectiveSort}
        dateRange={dateRange}
        customDateFrom={customRange?.fromYmd}
        customDateTo={customRange?.toYmd}
        latestActivityByRequestId={latestActivityByRequestId}
        nextCursor={requestPage.nextCursor}
      />
    </div>
  );
}
