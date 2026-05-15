import { notFound, redirect } from "next/navigation";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { isLocale } from "@/lib/i18n/config";
import {
  adminAllowedOfficeIds,
  adminCanManageUser,
} from "@/lib/office-requests/admin-access";
import { getAdminSession } from "@/lib/office-requests/session";
import { listOffices, listUserProfiles } from "@/lib/office-requests/store";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);
  if (
    session.profile.role !== "super_admin" &&
    session.profile.role !== "office_admin"
  ) {
    redirect(`/${locale}/admin`);
  }

  const [allOffices, allUsers] = await Promise.all([
    listOffices({ includeInactive: true }),
    listUserProfiles(),
  ]);
  const isOfficeAdmin = session.profile.role === "office_admin";
  const allowedIds = adminAllowedOfficeIds(session.profile);
  const offices = isOfficeAdmin
    ? allOffices.filter((office) => allowedIds.includes(office.id))
    : allOffices;
  const users = isOfficeAdmin
    ? allUsers.filter((user) => adminCanManageUser(session.profile, user))
    : allUsers;

  return (
    <AdminUsersPanel
      locale={locale}
      offices={offices}
      users={users}
      sessionUid={session.uid}
      actorRole={session.profile.role}
    />
  );
}
