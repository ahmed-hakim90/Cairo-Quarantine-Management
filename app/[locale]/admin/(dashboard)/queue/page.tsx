import { notFound, redirect } from "next/navigation";
import { AdminQueueHub } from "@/components/queue/AdminQueueHub";
import { adminAllowedOfficeIds } from "@/lib/office-requests/admin-access";
import { getAdminSession } from "@/lib/office-requests/session";
import { listOffices } from "@/lib/office-requests/store";
import { isLocale } from "@/lib/i18n/config";
import { getDailyStats } from "@/lib/queue/daily-stats-service";
import { getTodayKey } from "@/lib/queue/queue-service";

export default async function AdminQueueHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);

  const role = session.profile.role;

  if (role === "office_user") {
    const officeId = session.profile.officeId?.trim();
    if (!officeId) redirect(`/${locale}/admin/pending-review`);
    redirect(`/${locale}/office-dashboard/${officeId}/queue`);
  }

  if (role !== "super_admin" && role !== "office_admin") {
    redirect(`/${locale}/admin`);
  }

  const isSuperAdmin = role === "super_admin";
  const allOffices = await listOffices({ includeInactive: isSuperAdmin });
  const allowedOfficeIds = adminAllowedOfficeIds(session.profile);
  const offices = isSuperAdmin
    ? allOffices
    : allOffices.filter((office) => allowedOfficeIds.includes(office.id));

  const queueDate = getTodayKey();
  const items = await Promise.all(
    offices.map(async (office) => ({
      office,
      stats: await getDailyStats(office.id, queueDate),
    })),
  );

  items.sort((a, b) => a.office.nameAr.localeCompare(b.office.nameAr, "ar"));

  return (
    <div className="mx-auto max-w-7xl">
      <header className="border-b border-gov-gray-200 pb-6">
        <p className="text-xs font-bold uppercase text-gov-gray-600">
          {isSuperAdmin ? "سوبر أدمن" : "أدمن مكاتب"}
        </p>
        <h1 className="mt-1 font-heading text-2xl font-extrabold text-gov-navy">
          طوابير المكاتب
        </h1>
        <p className="mt-2 text-sm text-gov-gray-600">
          نظرة على حضور اليوم ({queueDate}) لكل مكتب. اختر مكتباً لفتح شاشة
          الطابور والبحث وإتمام الأدوار.
        </p>
      </header>

      <div className="mt-8">
        <AdminQueueHub locale={locale} queueDate={queueDate} items={items} />
      </div>
    </div>
  );
}
