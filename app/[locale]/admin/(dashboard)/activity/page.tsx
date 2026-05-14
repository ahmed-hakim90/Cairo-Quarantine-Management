import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getAdminSession } from "@/lib/office-requests/session";
import { listActivityLogsForSuperAdmin } from "@/lib/office-requests/store";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage({
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

  const logs = await listActivityLogsForSuperAdmin({ limit: 200 });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm md:p-7">
        <h1 className="text-2xl font-extrabold text-gov-navy">سجل النشاط</h1>
        <p className="mt-2 text-sm text-gov-gray-600">
          آخر الإجراءات الإدارية في النظام (حتى 200 حدث).
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gov-gray-200 bg-white shadow-sm">
        {logs.length === 0 ? (
          <p className="p-6 text-sm text-gov-gray-600">
            لا توجد أحداث مسجّلة بعد. ستظهر هنا عند تنفيذ إجراءات من لوحة
            الإدارة.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-gov-gray-200 text-sm">
            <thead className="bg-gov-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gov-gray-600"
                >
                  التاريخ
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gov-gray-600"
                >
                  المنفّذ
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gov-gray-600"
                >
                  الإجراء
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-gray-100">
              {logs.map((row) => (
                <tr key={row.id} className="hover:bg-gov-gray-50/80">
                  <td className="whitespace-nowrap px-4 py-3 text-gov-gray-700">
                    {new Date(row.createdAt).toLocaleString("ar-EG")}
                  </td>
                  <td className="max-w-[10rem] truncate px-4 py-3 font-medium text-gov-navy md:max-w-xs">
                    {row.actorLabel}
                  </td>
                  <td className="px-4 py-3 text-gov-gray-800">{row.summaryAr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
