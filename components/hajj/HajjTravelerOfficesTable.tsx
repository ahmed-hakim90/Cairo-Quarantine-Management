import {
  CAIRO_TRAVELER_VACCINATION_OFFICES,
  type TravelerVaccinationService,
} from "@/data/hajj-traveler-offices-cairo";
import { OfficeContactIcons } from "@/components/ui/OfficeContactIcons";
import type { Messages } from "@/lib/i18n/messages";

type HajjTravelerOfficesTableProps = {
  content: Messages["hajjTable"];
  /** When set, only offices matching this service type are listed */
  serviceFilter?: TravelerVaccinationService;
};

function serviceLabel(
  service: TravelerVaccinationService,
  content: Messages["hajjTable"],
): string {
  return service === "hajj_umrah_travelers"
    ? content.serviceTravelers
    : content.serviceUmrahOnly;
}

export function HajjTravelerOfficesTable({
  content,
  serviceFilter,
}: HajjTravelerOfficesTableProps) {
  const rows =
    serviceFilter === undefined
      ? CAIRO_TRAVELER_VACCINATION_OFFICES
      : CAIRO_TRAVELER_VACCINATION_OFFICES.filter(
          (row) => row.service === serviceFilter,
        );

  return (
    <section
      className="mx-auto max-w-6xl px-4 py-14"
      aria-labelledby="cairo-traveler-offices-heading"
    >
      <h2
        id="cairo-traveler-offices-heading"
        className="font-heading text-2xl font-bold text-gov-navy sm:text-3xl"
      >
        {content.heading}
      </h2>
      <p className="mt-2 max-w-3xl text-gov-gray-600 leading-relaxed">
        {content.intro}
      </p>

      <ul
        className="mt-8 flex flex-col gap-3 md:hidden"
        aria-label={content.caption}
      >
        {rows.map((row) => (
          <li
            key={row.id}
            className={
              row.service === "hajj_umrah_travelers"
                ? "flex flex-row items-start gap-3 rounded-lg border border-gov-gray-200 bg-gov-gray-100 p-4 shadow-sm"
                : "flex flex-row items-start gap-3 rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm"
            }
          >
            <div className="min-w-0 flex-1 space-y-1.5 text-sm" lang="ar">
              <p className="font-heading font-semibold text-gov-navy">
                {row.officeNameAr}
              </p>
              <p className="text-gov-gray-700">{row.administrationAr}</p>
              <p className="text-gov-gray-700">{row.addressAr}</p>
              <p>
                <span className="inline-flex max-w-full rounded-full border border-gov-gray-200 bg-white px-2.5 py-0.5 text-xs font-medium text-gov-gray-800">
                  {serviceLabel(row.service, content)}
                </span>
              </p>
            </div>
            <OfficeContactIcons
              phone={row.phone ?? undefined}
              mapsUrl={row.mapsUrl}
              ariaPhone={content.a11yPhone}
              ariaMap={content.a11yMap}
              ariaPhoneUnavailable={content.a11yPhoneUnavailable}
              phoneMissingTitle={content.phoneMissing}
            />
          </li>
        ))}
      </ul>

      <div className="mt-8 hidden overflow-x-auto rounded-lg border border-gov-gray-200 shadow-sm md:block">
        <table className="min-w-[56rem] border-collapse text-start text-sm">
          <caption className="sr-only">{content.caption}</caption>
          <thead className="bg-gov-navy text-white">
            <tr>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                {content.colGov}
              </th>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                {content.colAdmin}
              </th>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                {content.colSerial}
              </th>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                {content.colOffice}
              </th>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                {content.colAddress}
              </th>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                {content.colPhone}
              </th>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                {content.colMaps}
              </th>
              <th scope="col" className="px-3 py-3 font-heading font-semibold">
                {content.colService}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gov-gray-200">
            {rows.map((row) => (
              <tr
                key={row.id}
                className={
                  row.service === "hajj_umrah_travelers"
                    ? "bg-gov-gray-100"
                    : "bg-white"
                }
              >
                <td className="whitespace-nowrap px-3 py-3 align-top text-gov-gray-700">
                  {content.governorate}
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
                  lang="ar"
                >
                  {row.officeNameAr}
                </th>
                <td
                  className="min-w-[200px] px-3 py-3 align-top text-gov-gray-700"
                  lang="ar"
                >
                  {row.addressAr}
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top font-mono text-gov-gray-700">
                  {row.phone ?? content.phoneMissing}
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top">
                  <a
                    href={row.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gov-accent underline-offset-2 hover:underline"
                  >
                    {content.mapsLink}
                  </a>
                </td>
                <td className="max-w-[11rem] px-3 py-3 align-top text-gov-gray-800">
                  {serviceLabel(row.service, content)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
