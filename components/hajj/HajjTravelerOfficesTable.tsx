import {
  CAIRO_TRAVELER_VACCINATION_OFFICES,
  serviceLabelAr,
} from "@/data/hajj-traveler-offices-cairo";

export function HajjTravelerOfficesTable() {
  return (
    <section
      className="mx-auto max-w-6xl px-4 py-14"
      aria-labelledby="cairo-traveler-offices-heading"
    >
      <h2
        id="cairo-traveler-offices-heading"
        className="font-heading text-2xl font-bold text-gov-navy sm:text-3xl"
      >
        قائمة مكاتب تطعيم المسافرين بالقاهرة لعام 2026
      </h2>
      <p className="mt-2 max-w-3xl text-gov-gray-600 leading-relaxed">
        البيانات معروضة للتوجيه؛ يُرجى التحقق من المواعيد والخدمات عبر القنوات
        الرسمية لوزارة الصحة قبل الحضور.
      </p>

      <div className="mt-8 overflow-x-auto rounded-lg border border-gov-gray-200 shadow-sm">
        <table className="min-w-[56rem] border-collapse text-start text-sm">
          <caption className="sr-only">
            مكاتب تطعيم المسافرين في محافظة القاهرة مع الإدارة والعنوان
            والهاتف ورابط الخرائط ونوع الخدمة
          </caption>
          <thead className="bg-gov-navy text-white">
            <tr>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                المحافظة
              </th>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                الإدارة
              </th>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                م.&nbsp;المحافظة
              </th>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                اسم المكتب
              </th>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                عنوان المكتب
              </th>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                رقم التليفون
              </th>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                الموقع
              </th>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                نوع الخدمة
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gov-gray-200">
            {CAIRO_TRAVELER_VACCINATION_OFFICES.map((row) => (
              <tr
                key={row.id}
                className={
                  row.service === "hajj_umrah_travelers"
                    ? "bg-gov-gray-100"
                    : "bg-white"
                }
              >
                <td className="whitespace-nowrap px-3 py-3 align-top text-gov-gray-700">
                  القاهرة
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top text-gov-gray-700">
                  {row.administrationAr}
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top text-gov-gray-700">
                  {row.serialInGovernorate}
                </td>
                <th
                  scope="row"
                  className="max-w-[160px] px-3 py-3 align-top font-medium text-gov-navy"
                >
                  {row.officeNameAr}
                </th>
                <td className="min-w-[200px] px-3 py-3 align-top text-gov-gray-700">
                  {row.addressAr}
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top font-mono text-gov-gray-700">
                  {row.phone ?? "——"}
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top">
                  <a
                    href={row.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gov-accent underline-offset-2 hover:underline"
                  >
                    خرائط Google
                  </a>
                </td>
                <td className="max-w-[11rem] px-3 py-3 align-top text-gov-gray-800">
                  {serviceLabelAr(row.service)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
