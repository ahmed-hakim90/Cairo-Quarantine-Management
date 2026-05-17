import { notFound, redirect } from "next/navigation";
import { OfficeFormDialog } from "@/components/admin/OfficeFormDialog";
import { SetOfficeActiveForm } from "@/components/admin/SetOfficeActiveForm";
import { isLocale } from "@/lib/i18n/config";
import { getAdminSession } from "@/lib/office-requests/session";
import { effectiveOfficeService } from "@/lib/office-requests/office-traveler-state";
import { listOffices, listTravelerStates } from "@/lib/office-requests/store";
import type { Office } from "@/lib/office-requests/types";

const SERVICE_LABELS: Record<Office["service"], string> = {
  hajj_umrah_travelers: "حج وعمرة ومسافرين دوليين",
  hajj_umrah_only: "حج وعمرة فقط",
};

export default async function AdminOfficesPage({
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

  const [offices, travelerStates] = await Promise.all([
    listOffices({ includeInactive: true }),
    listTravelerStates({ includeInactive: true }),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-gov-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gov-gray-600">
              سوبر أدمن
            </p>
            <h1 className="mt-1 font-heading text-2xl font-extrabold text-gov-navy">
              إدارة المكاتب
            </h1>
            <p className="mt-2 text-sm text-gov-gray-600">
              عرض وتعديل المكاتب. «حذف» يعطّل المكتب ويخفيه عن المسافرين دون
              مسح السجل.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OfficeFormDialog
              locale={locale}
              office={null}
              travelerStates={travelerStates}
              buttonLabel="إضافة مكتب"
              buttonClassName="inline-flex min-h-10 items-center justify-center rounded-md bg-gov-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-gov-navy"
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-gov-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gov-gray-200 text-sm">
            <thead className="bg-gov-gray-50 text-gov-navy">
              <tr>
                <th className="px-4 py-3 text-start">م</th>
                <th className="px-4 py-3 text-start">اسم المكتب</th>
                <th className="px-4 py-3 text-start">الإدارة</th>
                <th className="px-4 py-3 text-start">العنوان</th>
                <th className="px-4 py-3 text-start">الهاتف</th>
                <th className="px-4 py-3 text-start">الخدمة</th>
                <th className="px-4 py-3 text-start">الحالة</th>
                <th className="px-4 py-3 text-start">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-gray-100">
              {offices.map((office) => (
                <tr key={office.id} className="hover:bg-gov-gray-50/70">
                  <td className="px-4 py-3 whitespace-nowrap text-gov-gray-700">
                    {office.serialInGovernorate > 0 &&
                    office.serialInGovernorate < 9999
                      ? office.serialInGovernorate
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-bold text-gov-navy">
                    {office.nameAr}
                  </td>
                  <td className="max-w-[10rem] px-4 py-3 text-gov-gray-700">
                    {office.administrationAr}
                  </td>
                  <td className="max-w-[14rem] px-4 py-3 text-gov-gray-700">
                    {office.addressAr}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {office.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-gov-gray-700">
                    {SERVICE_LABELS[effectiveOfficeService(office)]}
                  </td>
                  <td className="px-4 py-3">
                    {office.active ? (
                      <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-800 ring-1 ring-emerald-100">
                        نشط
                      </span>
                    ) : (
                      <span className="inline-flex rounded-md bg-gov-gray-100 px-2 py-1 text-xs font-extrabold text-gov-gray-700 ring-1 ring-gov-gray-200">
                        معطّل
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <OfficeFormDialog
                        locale={locale}
                        office={office}
                        travelerStates={travelerStates}
                        buttonLabel="تعديل"
                      />
                      {office.active ? (
                        <SetOfficeActiveForm
                          locale={locale}
                          officeId={office.id}
                          officeNameAr={office.nameAr}
                          active={false}
                          label="حذف"
                        />
                      ) : (
                        <SetOfficeActiveForm
                          locale={locale}
                          officeId={office.id}
                          officeNameAr={office.nameAr}
                          active
                          label="تفعيل"
                          className="inline-flex min-h-9 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-900 transition hover:bg-emerald-100"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {offices.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gov-gray-600"
                  >
                    لا توجد مكاتب.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
    </div>
  );
}
