import { notFound, redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { isLocale } from "@/lib/i18n/config";
import { getAdminSession } from "@/lib/office-requests/session";
import {
  listMessageTemplates,
  listOffices,
  listRequestsForSession,
  listUserProfiles,
} from "@/lib/office-requests/store";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);

  const [offices, requests, templates, users] = await Promise.all([
    listOffices({ includeInactive: session.profile.role === "super_admin" }),
    listRequestsForSession({
      role: session.profile.role,
      officeId: session.profile.officeId,
    }),
    listMessageTemplates(),
    session.profile.role === "super_admin" ? listUserProfiles() : [],
  ]);

  return (
    <AdminDashboard
      locale={locale}
      session={session}
      offices={offices}
      requests={requests}
      templates={templates}
      users={users}
    />
  );
}
