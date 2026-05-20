import { notFound, redirect } from "next/navigation";
import { DestinationCountriesExcelUpload } from "@/components/admin/DestinationCountriesExcelUpload";
import { isLocale } from "@/lib/i18n/config";
import { getAdminSession } from "@/lib/office-requests/session";
import { listDestinationCountriesForAdmin } from "@/lib/office-requests/store";

function formatUpdatedAt(value: string | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ar-EG", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

export default async function AdminDestinationCountriesPage({
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

  const countries = await listDestinationCountriesForAdmin();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="border-b border-gov-gray-200 pb-6">
        <p className="text-xs font-bold uppercase text-gov-gray-600">
          سوبر أدمن
        </p>
        <h1 className="mt-1 font-heading text-2xl font-extrabold text-gov-navy">
          متطلبات تطعيم دول المسافر
        </h1>
        <p className="mt-2 text-sm text-gov-gray-600">
          إدارة قائمة الدول ومتطلبات التطعيم المعروضة في صفحة المسافر الدولي.
          أسماء الدول ثابتة بعد التأسيس؛ يمكن تحديث عمود المتطلبات عبر Excel.
        </p>
      </div>

      <div className="mt-6">
        <DestinationCountriesExcelUpload />
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-gov-gray-200 bg-white shadow-sm">
        <div className="border-b border-gov-gray-200 px-4 py-3">
          <h2 className="font-heading text-lg font-bold text-gov-navy">
            المعاينة ({countries.length})
          </h2>
        </div>
        {countries.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gov-gray-600">
            لا توجد دول بعد. ارفع ملف Excel للتأسيس الأول.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-gov-gray-200 text-sm">
            <thead className="bg-gov-gray-50 text-gov-navy">
              <tr>
                <th className="px-4 py-3 text-start">م</th>
                <th className="px-4 py-3 text-start">الاسم (إنجليزي)</th>
                <th className="px-4 py-3 text-start">الاسم (عربي)</th>
                <th className="px-4 py-3 text-start">متطلبات التطعيم</th>
                <th className="px-4 py-3 text-start">آخر تحديث</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-gray-100">
              {countries.map((row, index) => (
                <tr key={row.id} className="hover:bg-gov-gray-50/70">
                  <td className="whitespace-nowrap px-4 py-3 text-gov-gray-600">
                    {index + 1}
                  </td>
                  <td
                    className="max-w-[12rem] px-4 py-3 font-mono text-xs text-gov-gray-800"
                    dir="ltr"
                  >
                    {row.nameEn}
                  </td>
                  <td className="max-w-[10rem] px-4 py-3 font-bold text-gov-navy">
                    {row.nameAr}
                  </td>
                  <td className="max-w-md px-4 py-3 text-gov-gray-700">
                    {row.requirementsAr}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gov-gray-600">
                    {formatUpdatedAt(row.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
