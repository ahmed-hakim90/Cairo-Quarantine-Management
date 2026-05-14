import { notFound, redirect } from "next/navigation";
import { AdminRequestsTable } from "@/components/admin/AdminRequestsTable";
import { SuperAdminExportLauncher } from "@/components/admin/SuperAdminExportLauncher";
import { isLocale } from "@/lib/i18n/config";
import { getAdminSession } from "@/lib/office-requests/session";
import {
  listOffices,
  listRequestsForSession,
  listTravelerStates,
} from "@/lib/office-requests/store";
import type { Office } from "@/lib/office-requests/types";

export default async function AdminRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);

  const isSuperAdmin = session.profile.role === "super_admin";

  const [offices, requests, travelerStates] = await Promise.all([
    isSuperAdmin
      ? listOffices({ includeInactive: true })
      : Promise.resolve<Office[]>([]),
    listRequestsForSession({
      role: session.profile.role,
      officeId: session.profile.officeId,
    }),
    listTravelerStates({ includeInactive: true }),
  ]);

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
              offices={offices}
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
      />
    </div>
  );
}
