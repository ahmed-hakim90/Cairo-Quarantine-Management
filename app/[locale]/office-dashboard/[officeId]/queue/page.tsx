import { notFound, redirect } from "next/navigation";
import { OfficeQueuePanel } from "@/components/queue/OfficeQueuePanel";
import { AdminDashboardLayout } from "@/components/admin/AdminDashboardLayout";
import { adminCanAccessOffice } from "@/lib/office-requests/admin-access";
import { getOffice } from "@/lib/office-requests/store";
import {
  getAdminSession,
  shouldShowAdminPendingReview,
} from "@/lib/office-requests/session";
import { isLocale } from "@/lib/i18n/config";
import { getQueueDashboard, getTodayKey } from "@/lib/queue/queue-service";

export default async function OfficeQueuePage({
  params,
}: {
  params: Promise<{ locale: string; officeId: string }>;
}) {
  const { locale, officeId } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);
  if (shouldShowAdminPendingReview(session)) {
    redirect(`/${locale}/admin/pending-review`);
  }
  if (!adminCanAccessOffice(session.profile, officeId)) {
    redirect(`/${locale}/admin`);
  }

  const office = await getOffice(officeId);
  if (!office) notFound();

  const queueDate = getTodayKey();
  const { stats } = await getQueueDashboard(officeId, queueDate);

  return (
    <AdminDashboardLayout
      locale={locale}
      displayName={session.profile.displayName}
      role={session.profile.role}
      officeId={session.profile.officeId}
      allowedOfficeIds={session.profile.allowedOfficeIds ?? []}
      officeNameAr={office.nameAr}
    >
      <OfficeQueuePanel
        locale={locale}
        officeId={officeId}
        officeNameAr={office.nameAr}
        queueDate={queueDate}
        stats={stats}
      />
    </AdminDashboardLayout>
  );
}
