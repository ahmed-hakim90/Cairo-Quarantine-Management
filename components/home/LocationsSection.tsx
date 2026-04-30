import { VACCINATION_CENTERS } from "@/data/locations";

export function LocationsSection() {
  return (
    <section
      className="bg-white py-14"
      aria-labelledby="locations-heading"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2
          id="locations-heading"
          className="font-heading text-2xl font-bold text-gov-navy sm:text-3xl"
        >
          مراكز التطعيم المعتمدة
        </h2>
        <p className="mt-2 max-w-2xl text-gov-gray-600">
          قائمة مكاتب تطعيم المسافرين بالقاهرة لعام ٢٠٢٦ — خدمات{" "}
          <span className="font-medium text-gov-navy">
            حجاج ومعتمرين ومسافرين
          </span>
         
         
        </p>

        <div className="mt-8 overflow-x-auto rounded-lg border border-gov-gray-200 shadow-sm">
          <table className="min-w-full border-collapse text-start text-sm">
            <caption className="sr-only">
              جدول مكاتب التطعيم المعتمدة بالقاهرة: اسم المكتب، الإدارة، المحافظة، العنوان، الهاتف، رابط الموقع
            </caption>
            <thead className="bg-gov-navy text-white">
              <tr>
                <th scope="col" className="px-4 py-4 font-heading font-semibold">
                  اسم المكتب
                </th>
                <th scope="col" className="px-4 py-4 font-heading font-semibold">
                  الإدارة
                </th>
                <th scope="col" className="px-4 py-4 font-heading font-semibold">
                  المحافظة
                </th>
                <th scope="col" className="px-4 py-4 font-heading font-semibold">
                  العنوان
                </th>
                <th scope="col" className="px-4 py-4 font-heading font-semibold">
                  الهاتف
                </th>
                <th scope="col" className="px-4 py-4 font-heading font-semibold">
                  الموقع
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-gray-200 bg-white">
              {VACCINATION_CENTERS.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-gov-gray-50/70"}
                >
                  <th
                    scope="row"
                    className="max-w-[220px] px-4 py-4 font-medium text-gov-navy"
                  >
                    {row.centerNameAr}
                  </th>
                  <td className="whitespace-nowrap px-4 py-4 text-gov-gray-700">
                    {row.administrationAr}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-gov-gray-700">
                    {row.governorateAr}
                  </td>
                  <td className="min-w-[200px] px-4 py-4 text-gov-gray-700">
                    {row.addressAr}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-gov-gray-700">
                    {row.phone}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-gov-gray-700">
                    {row.mapsUrl ? (
                      <a
                        href={row.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gov-navy underline decoration-gov-gray-300 underline-offset-2 hover:decoration-gov-navy"
                      >
                        خريطة Google
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
