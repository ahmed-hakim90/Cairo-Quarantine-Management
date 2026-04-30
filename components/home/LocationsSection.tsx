import { VACCINATION_CENTERS } from "@/data/locations";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type LocationsSectionProps = {
  locale: Locale;
  content: Messages["locations"];
};

export function LocationsSection({ locale, content }: LocationsSectionProps) {
  const useEnFields = locale !== "ar";

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
          {content.heading}
        </h2>
        <p className="mt-2 max-w-2xl text-gov-gray-600">
          {content.introLead}{" "}
          <span className="font-medium text-gov-navy">
            {content.introHighlight}
          </span>
        </p>

        <div className="mt-8 overflow-x-auto rounded-lg border border-gov-gray-200 shadow-sm">
          <table className="min-w-full border-collapse text-start text-sm">
            <caption className="sr-only">{content.caption}</caption>
            <thead className="bg-gov-navy text-white">
              <tr>
                <th scope="col" className="px-4 py-4 font-heading font-semibold">
                  {content.colOffice}
                </th>
                <th scope="col" className="px-4 py-4 font-heading font-semibold">
                  {content.colAdmin}
                </th>
                <th scope="col" className="px-4 py-4 font-heading font-semibold">
                  {content.colGov}
                </th>
                <th scope="col" className="px-4 py-4 font-heading font-semibold">
                  {content.colAddress}
                </th>
                <th scope="col" className="px-4 py-4 font-heading font-semibold">
                  {content.colPhone}
                </th>
                <th scope="col" className="px-4 py-4 font-heading font-semibold">
                  {content.colMaps}
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
                    {useEnFields ? row.centerNameEn : row.centerNameAr}
                  </th>
                  <td className="whitespace-nowrap px-4 py-4 text-gov-gray-700">
                    {useEnFields ? row.administrationEn : row.administrationAr}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-gov-gray-700">
                    {useEnFields ? row.governorateEn : row.governorateAr}
                  </td>
                  <td className="min-w-[200px] px-4 py-4 text-gov-gray-700">
                    {useEnFields ? row.addressEn : row.addressAr}
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
                        {content.mapsLink}
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
