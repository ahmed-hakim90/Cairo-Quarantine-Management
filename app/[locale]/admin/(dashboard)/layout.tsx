import { notFound, redirect } from "next/navigation";
import { AdminDashboardLayout } from "@/components/admin/AdminDashboardLayout";
import { isLocale } from "@/lib/i18n/config";
import { getOffice } from "@/lib/office-requests/store";
import {
  getAdminSession,
  shouldShowAdminPendingReview,
} from "@/lib/office-requests/session";

export default async function AdminDashboardShellLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);
  if (shouldShowAdminPendingReview(session)) {
    redirect(`/${locale}/admin/pending-review`);
  }

  const officeId = session.profile.officeId?.trim() ?? "";
  const officeNameAr =
    session.profile.role === "office_user" && officeId
      ? (await getOffice(officeId))?.nameAr ?? null
      : null;

  return (
    <AdminDashboardLayout
      locale={locale}
      displayName={session.profile.displayName}
      role={session.profile.role}
      officeId={session.profile.officeId}
      allowedOfficeIds={session.profile.allowedOfficeIds ?? []}
      officeNameAr={officeNameAr}
    >
      {children}
    </AdminDashboardLayout>
  );
}
