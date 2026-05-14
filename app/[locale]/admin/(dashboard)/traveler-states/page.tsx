import { notFound, redirect } from "next/navigation";
import { SetTravelerStateActiveForm } from "@/components/admin/SetTravelerStateActiveForm";
import { TravelerStateFormDialog } from "@/components/admin/TravelerStateFormDialog";
import { isLocale } from "@/lib/i18n/config";
import { getAdminSession } from "@/lib/office-requests/session";
import { listTravelerStates } from "@/lib/office-requests/store";

export default async function AdminTravelerStatesPage({
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

  const states = await listTravelerStates({ includeInactive: true });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 border-b border-gov-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gov-gray-600">
            سوبر أدمن
          </p>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-gov-navy">
            حالات المسافرين
          </h1>
          <p className="mt-2 text-sm text-gov-gray-600">
            تعريف الحالات التي يختارها المسافر في الحجز، وربط كل مكتب بالحالات
            المناسبة من صفحة «المكاتب».
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TravelerStateFormDialog
            locale={locale}
            state={null}
            buttonLabel="إضافة حالة"
            buttonClassName="inline-flex min-h-10 items-center justify-center rounded-md bg-gov-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-gov-navy"
          />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gov-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gov-gray-200 text-sm">
          <thead className="bg-gov-gray-50 text-gov-navy">
            <tr>
              <th className="px-4 py-3 text-start">المعرّف</th>
              <th className="px-4 py-3 text-start">الاسم</th>
              <th className="px-4 py-3 text-start">الترتيب</th>
              <th className="px-4 py-3 text-start">الحالة</th>
              <th className="px-4 py-3 text-start">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gov-gray-100">
            {states.map((row) => (
              <tr key={row.id} className="hover:bg-gov-gray-50/70">
                <td className="px-4 py-3 font-mono text-xs text-gov-gray-800">
                  {row.id}
                </td>
                <td className="max-w-[18rem] px-4 py-3 font-bold text-gov-navy">
                  {row.labelAr}
                </td>
                <td className="px-4 py-3 tabular-nums text-gov-gray-700">
                  {row.sortOrder}
                </td>
                <td className="px-4 py-3">
                  {row.active ? (
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
                    <TravelerStateFormDialog
                      locale={locale}
                      state={row}
                      buttonLabel="تعديل"
                    />
                    {row.active ? (
                      <SetTravelerStateActiveForm
                        locale={locale}
                        travelerStateId={row.id}
                        labelAr={row.labelAr}
                        active={false}
                        label="تعطيل"
                      />
                    ) : (
                      <SetTravelerStateActiveForm
                        locale={locale}
                        travelerStateId={row.id}
                        labelAr={row.labelAr}
                        active
                        label="تفعيل"
                        className="inline-flex min-h-9 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-900 transition hover:bg-emerald-100"
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {states.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gov-gray-600"
                >
                  لا توجد حالات بعد. أضف حالةً بمعرّف لاتيني (مثل international
                  أو crew-transit) ثم اربطها بالمكاتب من «إدارة المكاتب».
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
