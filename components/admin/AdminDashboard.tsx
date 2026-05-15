import { logoutAdmin } from "@/app/[locale]/admin/actions";
import { AdminRequestsTable } from "@/components/admin/AdminRequestsTable";
import { defaultTravelerStatesFromLegacyLabels } from "@/lib/office-requests/office-traveler-state";
import { roleLabelAr } from "@/lib/office-requests/admin-access";
import { SuperAdminExportLauncher } from "@/components/admin/SuperAdminExportLauncher";
import { SuperAdminUsersSection } from "@/components/admin/SuperAdminUsersSection";
import {
  type AdminSession,
  type AdminUserProfile,
  type MessageTemplate,
  type Office,
  type OfficeRequest,
} from "@/lib/office-requests/types";

type AdminDashboardProps = {
  locale: string;
  session: AdminSession;
  offices: Office[];
  requests: OfficeRequest[];
  templates: MessageTemplate[];
  users: AdminUserProfile[];
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase text-gov-gray-600">{label}</p>
      <p className="mt-2 text-3xl font-extrabold leading-none text-gov-navy">
        {value}
      </p>
    </div>
  );
}

export function AdminDashboard({
  locale,
  session,
  offices,
  requests,
  templates,
  users,
}: AdminDashboardProps) {
  const isSuperAdmin = session.profile.role === "super_admin";
  const newCount = requests.filter((request) => request.status === "new").length;
  const activeCount = requests.filter(
    (request) =>
      request.status === "new" ||
      request.status === "in_progress" ||
      request.status === "contacted",
  ).length;

  return (
    <section className="bg-gov-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-flex rounded-md bg-gov-accent-muted px-3 py-1 text-sm font-bold text-gov-navy">
              {roleLabelAr(session.profile.role)}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-gov-navy">
              لوحة متابعة الحجوزات والطلبات
            </h1>
            <p className="mt-2 text-sm text-gov-gray-600">
              مرحباً {session.profile.displayName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {isSuperAdmin ? (
              <SuperAdminExportLauncher offices={offices} />
            ) : session.profile.officeId ? (
              <SuperAdminExportLauncher
                lockedOfficeId={session.profile.officeId}
              />
            ) : null}
            <form action={logoutAdmin.bind(null, locale)}>
              <button className="inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-200 px-4 py-2 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50">
                تسجيل خروج
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي الطلبات" value={requests.length} />
        <StatCard label="طلبات جديدة" value={newCount} />
        <StatCard label="قيد المتابعة" value={activeCount} />
        <StatCard label="المكاتب المتاحة" value={offices.length} />
      </div>

      <AdminRequestsTable
        requests={requests}
        locale={locale}
        travelerStates={defaultTravelerStatesFromLegacyLabels()}
        requestsListHref={`/${locale}/admin/requests`}
        statusFilter="all"
        sort="created_desc"
      />

      {isSuperAdmin ? (
        <>
          <SuperAdminUsersSection
            locale={locale}
            offices={offices}
            users={users}
            templates={templates}
            sessionUid={session.uid}
          />
        </>
      ) : null}
      </div>
    </section>
  );
}
