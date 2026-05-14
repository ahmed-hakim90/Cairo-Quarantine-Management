import { notFound, redirect } from "next/navigation";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { isLocale } from "@/lib/i18n/config";
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
  if (session.profile.role !== "super_admin") {
    redirect(`/${locale}/admin`);
  }

  const [offices, users] = await Promise.all([
    listOffices({ includeInactive: true }),
    listUserProfiles(),
  ]);

  return (
    <AdminUsersPanel
      locale={locale}
      offices={offices}
      users={users}
      sessionUid={session.uid}
    />
  );
}
