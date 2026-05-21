import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { SuperAdminExportLauncher } from "@/components/admin/SuperAdminExportLauncher";
import { isLocale } from "@/lib/i18n/config";
import { getAdminSession } from "@/lib/office-requests/session";
import {
  listOffices,
  listTravelerStates,
} from "@/lib/office-requests/store";

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);

  const isSuperAdmin = session.profile.role === "super_admin";
  const offices = await listOffices({ includeInactive: isSuperAdmin });
  const travelerStates = await listTravelerStates({ includeInactive: true });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-extrabold text-gov-navy">التقارير</h1>
        <p className="mt-2 text-sm text-gov-gray-600">
          تصدير البيانات وواجهة JSON للتحليلات (BI أو أدوات خارجية).
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-md border border-gov-gray-200 bg-gov-gray-50 p-4">
            <h2 className="text-sm font-bold text-gov-navy">تصدير Excel</h2>
            <p className="mt-1 text-xs text-gov-gray-600">
              طلبات، مكاتب، لقاحات — حد 10,000 صف للطلبات.
            </p>
            <div className="mt-3">
              <SuperAdminExportLauncher
                offices={offices}
                travelerStates={travelerStates}
                lockedOfficeId={
                  !isSuperAdmin ? session.profile.officeId ?? undefined : undefined
                }
              />
            </div>
          </div>

          <div className="rounded-md border border-gov-gray-200 bg-gov-gray-50 p-4">
            <h2 className="text-sm font-bold text-gov-navy">API التحليلات</h2>
            <p className="mt-1 text-xs leading-relaxed text-gov-gray-600">
              بعد تسجيل الدخول للوحة، استدعِ من نفس المتصفح (جلسة الكوكي):
            </p>
            <code className="mt-2 block break-all rounded bg-white px-3 py-2 text-xs text-gov-navy">
              GET /api/admin/analytics
            </code>
            <p className="mt-2 text-xs text-gov-gray-600">
              معاملات اختيارية: <code className="rounded bg-white px-1">officeId</code>،{" "}
              <code className="rounded bg-white px-1">range</code>،{" "}
              <code className="rounded bg-white px-1">from</code>،{" "}
              <code className="rounded bg-white px-1">to</code> (نفس فلاتر لوحة التحكم).
            </p>
          </div>

          <p className="text-sm">
            <Link
              href={`/${locale}/admin`}
              className="font-bold text-gov-accent hover:text-gov-navy"
            >
              ← العودة إلى التحكم والتحليلات
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
