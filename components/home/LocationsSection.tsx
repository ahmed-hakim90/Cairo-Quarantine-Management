import { VACCINATION_CENTERS } from "@/data/locations";
import { OfficeContactIcons } from "@/components/ui/OfficeContactIcons";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type LocationsSectionProps = {
  locale: Locale;
  content: Messages["locations"];
  /** When set (e.g. citizen services), replaces content.heading */
  sectionTitle?: string;
  /** When set, replaces content.caption for the table/list accessible name */
  tableCaption?: string;
};

export function LocationsSection({
  locale,
  content,
  sectionTitle,
  tableCaption,
}: LocationsSectionProps) {
  const useEnFields = locale !== "ar";
  const headingText = sectionTitle ?? content.heading;
  const captionText = tableCaption ?? content.caption;

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
          {headingText}
        </h2>
        <p className="mt-2 max-w-2xl text-gov-gray-600">
          {content.introLead}{" "}
          <span className="font-medium text-gov-navy">
            {content.introHighlight}
          </span>
        </p>

        <ul className="mt-8 flex flex-col gap-3 md:hidden" aria-label={captionText}>
          {VACCINATION_CENTERS.map((row) => {
            const office = useEnFields ? row.centerNameEn : row.centerNameAr;
            const admin = useEnFields
              ? row.administrationEn
              : row.administrationAr;
            const gov = useEnFields ? row.governorateEn : row.governorateAr;
            const address = useEnFields ? row.addressEn : row.addressAr;

            return (
              <li
                key={row.id}
                className="flex flex-row items-start gap-3 rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1 space-y-1.5 text-sm">
                  <p className="font-heading font-semibold text-gov-navy">
                    {office}
                  </p>
                  <p className="text-gov-gray-700">{admin}</p>
                  <p className="text-sm text-gov-gray-600">
                    <span className="text-gov-gray-500">{content.colGov}: </span>
                    {gov}
                  </p>
                  <p className="text-gov-gray-700">{address}</p>
                </div>
                <OfficeContactIcons
                  phone={row.phone}
                  mapsUrl={row.mapsUrl}
                  ariaPhone={content.a11yPhone}
                  ariaMap={content.a11yMap}
                />
              </li>
            );
          })}
        </ul>

        <div className="mt-8 hidden overflow-x-auto rounded-lg border border-gov-gray-200 shadow-sm md:block">
          <table className="min-w-full border-collapse text-start text-sm">
            <caption className="sr-only">{captionText}</caption>
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
