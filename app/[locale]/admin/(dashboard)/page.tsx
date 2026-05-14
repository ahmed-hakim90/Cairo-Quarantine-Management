import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AdminAnalyticsCharts } from "@/components/admin/AdminAnalyticsCharts";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { SuperAdminDashboardOfficeFilter } from "@/components/admin/SuperAdminDashboardOfficeFilter";
import { SuperAdminExportLauncher } from "@/components/admin/SuperAdminExportLauncher";
import { isLocale } from "@/lib/i18n/config";
import { buildAdminRequestAnalytics } from "@/lib/office-requests/analytics";
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
  const offices = await listOffices({ includeInactive: isSuperAdmin });

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

  const [requests, travelerStates] = await Promise.all([
    listRequestsForSession({
      role: session.profile.role,
      officeId: session.profile.officeId,
      ...(officeFilter ? { officeFilter } : {}),
    }),
    listTravelerStates({ includeInactive: true }),
  ]);

  const newCount = requests.filter((request) => request.status === "new").length;
  const activeCount = requests.filter(
    (request) =>
      request.status === "new" ||
      request.status === "in_progress" ||
      request.status === "contacted",
  ).length;

  const analytics = buildAdminRequestAnalytics(requests);

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
          <div className="flex shrink-0 flex-col gap-4 sm:items-end">
            {isSuperAdmin ? (
              <>
                <Suspense
                  fallback={
                    <div
                      className="h-[4.25rem] w-full max-w-xs animate-pulse rounded-md bg-gov-gray-100 sm:max-w-xs"
                      aria-hidden
                    />
                  }
                >
                  <SuperAdminDashboardOfficeFilter
                    locale={locale}
                    offices={offices}
                    selectedOfficeId={selectedOfficeId}
                  />
                </Suspense>
                <div className="sm:pt-0">
                  <SuperAdminExportLauncher
                    offices={offices}
                    travelerStates={travelerStates}
                  />
                </div>
              </>
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
      </div>

      <div className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="إجمالي الطلبات" value={requests.length} />
        <AdminStatCard label="طلبات جديدة" value={newCount} />
        <AdminStatCard label="قيد المتابعة" value={activeCount} />
        {selectedOfficeNameAr ? (
          <AdminStatCard label="المكتب" value={selectedOfficeNameAr} />
        ) : (
          <AdminStatCard label="المكاتب المتاحة" value={offices.length} />
        )}
      </div>

      <AdminAnalyticsCharts analytics={analytics} />
    </div>
  );
}
