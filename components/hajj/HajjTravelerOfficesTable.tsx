import { OfficeContactIcons } from "@/components/ui/OfficeContactIcons";
import { resolveOfficeMapUrl } from "@/lib/google-maps-url";
import { getOfficeWorkingHoursTableLabel } from "@/lib/office-working-hours";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { effectiveOfficeService } from "@/lib/office-requests/office-traveler-state";
import type { Office } from "@/lib/office-requests/types";

type TravelerVaccinationService = Office["service"];

type HajjTravelerOfficesTableProps = {
  content: Messages["hajjTable"];
  locale: Locale;
  offices: Office[];
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

const OFFICE_FR: Record<string, { admin: string; name: string; address: string }> = {
  "cairo-trav-1": {
    admin: "Vaccination internationale de l'aeroport",
    name: "Bureau de vaccination international — aeroport",
    address: "Hall 1, ancien aeroport",
  },
  "cairo-trav-2": {
    admin: "El Sahel",
    name: "Bureau Sharif",
    address: "37 rue Mohamed El-Hawary, Khalfaoui, a cote de la station de metro",
  },
  "cairo-trav-3": {
    admin: "Sayeda Zeinab",
    name: "Protection de l'enfance du Vieux Caire",
    address: "Rue El Sabaa Seqayat, pres de l'ecole El Sabbahin — Sayeda Zeinab",
  },
  "cairo-trav-4": {
    admin: "El Shorouk",
    name: "Bureau d'immunisation d'El Shorouk",
    address: "Ville d'El Shorouk — Markazi 63 M",
  },
  "cairo-trav-5": {
    admin: "Nouveau Caire",
    name: "Premier regroupement",
    address: "10e voisinage, face a l'autorite du Premier regroupement",
  },
  "cairo-trav-6": {
    admin: "Nouveau Caire",
    name: "Troisieme regroupement (rattache temporairement au centre medical Katameya)",
    address: "Katameya, station El Bank, pres de l'ecole commune Katameya",
  },
  "cairo-trav-7": {
    admin: "Nouveau Caire",
    name: "Cinquieme regroupement",
    address: "A cote du centre commercial Annaba — Cinquieme regroupement",
  },
  "cairo-trav-8": {
    admin: "El Marg",
    name: "Bureau de sante El Andalus",
    address: "Rue Moassaset El Zakah, pres de l'hopital de chirurgie d'un jour",
  },
  "cairo-trav-9": {
    admin: "Maadi",
    name: "Maadi",
    address: "71 place El Taawoun, Maadi",
  },
  "cairo-trav-10": {
    admin: "El Maasara",
    name: "Hadayek Helwan",
    address: "Rue Khaled Ibn El Walid, face au commissariat d'El Maasara",
  },
  "cairo-trav-11": {
    admin: "Mokattam",
    name: "El-Asmarat",
    address: "Ville El-Asmarat, Mokattam, batiment 31, Al Jawhara",
  },
  "cairo-trav-12": {
    admin: "Nozha",
    name: "Tribunal",
    address: "32 rue Hegaz, face au tribunal d'Heliopolis",
  },
  "cairo-trav-13": {
    admin: "Nozha",
    name: "Nozha El Gedida",
    address: "38 rue Joseph Tito",
  },
  "cairo-trav-14": {
    admin: "El Waily",
    name: "Bureau de sante Abbasiya",
    address: "2 rue de l'Hopital Italien, Abbasiya",
  },
  "cairo-trav-15": {
    admin: "Hadayek El Qobba",
    name: "El Waily El Kebir",
    address: "3 rue Medhat Nour, derriere le commissariat de Hadayek",
  },
  "cairo-trav-16": {
    admin: "Helwan",
    name: "Set Khadra",
    address: "Rue Ragheb depuis la rue Burhan, Helwan",
  },
  "cairo-trav-17": {
    admin: "15 Mai",
    name: "Bureau d'immunisation 15 Mai",
    address: "Voisinage 5, pres de l'ecole experimentale Mostafa Nassar",
  },
  "cairo-trav-18": {
    admin: "Rod El Farag",
    name: "Centre urbain",
    address: "Pres de l'hopital de chirurgie d'un jour — Rod El Farag",
  },
  "cairo-trav-19": {
    admin: "Abdeen",
    name: "Abdeen",
    address: "197 rue Tahrir — Bab El Louq",
  },
  "cairo-trav-20": {
    admin: "Ouest",
    name: "Qasr El Nil",
    address: "7 rue Reda depuis la rue El Mobtadian, Sayeda Zeinab",
  },
  "cairo-trav-21": {
    admin: "Vieux Caire",
    name: "Bureau de sante El Manial",
    address: "15 rue Ibrahim Baher Zaghloul — El Manial",
  },
  "cairo-trav-22": {
    admin: "Est de Nasr City",
    name: "Unite de sante Nasr 1",
    address: "14 rue Immeubles Rabie, route El Nasr",
  },
  "cairo-trav-23": {
    admin: "Est de Nasr City",
    name: "El Amal (anciennement El Haggana)",
    address: "Rue Mostafa El Nahas — El Taba — Est de Nasr City",
  },
  "cairo-trav-24": {
    admin: "Ouest de Nasr City",
    name: "Unite de sante Nasr 2",
    address: "6e district, pres de l'hopital de chirurgie d'un jour",
  },
  "cairo-trav-25": {
    admin: "Heliopolis",
    name: "Heliopolis",
    address: "54 rue Khalifa El Maamoun — Roxy — Heliopolis",
  },
};

function officeFields(row: Office, locale: Locale) {
  if (locale === "fr") {
    const fr = OFFICE_FR[row.id];
    if (fr) return fr;
  }
  return {
    admin: row.administrationAr,
    name: row.nameAr,
    address: row.addressAr,
  };
}

export function HajjTravelerOfficesTable({
  content,
  locale,
  offices,
  serviceFilter,
}: HajjTravelerOfficesTableProps) {
  const rows =
    serviceFilter === undefined
      ? offices
      : offices.filter(
          (row) => effectiveOfficeService(row) === serviceFilter,
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
        {rows.map((row) => {
          const service = effectiveOfficeService(row);
          const fields = officeFields(row, locale);
          const mapsUrl = resolveOfficeMapUrl({
            mapsUrl: row.mapsUrl,
            placeTitle: fields.name,
            address: fields.address,
            locale,
          });
          const workingHours = getOfficeWorkingHoursTableLabel(row.id, locale);
          return (
            <li
              key={row.id}
              className={
                service === "hajj_umrah_travelers"
                  ? "flex flex-row items-start gap-3 rounded-lg border border-gov-gray-200 bg-gov-gray-100 p-4 shadow-sm"
                  : "flex flex-row items-start gap-3 rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm"
              }
            >
              <div className="min-w-0 flex-1 space-y-1.5 text-sm" lang={locale === "fr" ? "fr" : "ar"}>
                <p className="font-heading font-semibold text-gov-navy">
                  {fields.name}
                </p>
                <p className="text-gov-gray-700">{fields.admin}</p>
                <p className="text-gov-gray-700">{fields.address}</p>
                <p className="text-gov-gray-700">
                  <span className="font-medium text-gov-navy">
                    {content.colHours}:{" "}
                  </span>
                  {workingHours}
                </p>
                <p>
                  <span className="inline-flex max-w-full rounded-full border border-gov-gray-200 bg-white px-2.5 py-0.5 text-xs font-medium text-gov-gray-800">
                    {serviceLabel(service, content)}
                  </span>
                </p>
              </div>
              <OfficeContactIcons
                phone={row.phone ?? undefined}
                mapsUrl={mapsUrl}
                ariaPhone={content.a11yPhone}
                ariaMap={content.a11yMap}
                ariaPhoneUnavailable={content.a11yPhoneUnavailable}
                phoneMissingTitle={content.phoneMissing}
              />
            </li>
          );
        })}
      </ul>

      <div className="mt-8 hidden overflow-x-auto rounded-lg border border-gov-gray-200 shadow-sm md:block">
        <table className="min-w-[64rem] border-collapse text-start text-sm">
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
                {content.colHours}
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
            {rows.map((row) => {
              const service = effectiveOfficeService(row);
              const fields = officeFields(row, locale);
              const mapsUrl = resolveOfficeMapUrl({
                mapsUrl: row.mapsUrl,
                placeTitle: fields.name,
                address: fields.address,
                locale,
              });
              const serialDisplay =
                row.serialInGovernorate > 0 && row.serialInGovernorate < 9999
                  ? row.serialInGovernorate
                  : "—";
              const workingHours = getOfficeWorkingHoursTableLabel(
                row.id,
                locale,
              );
              return (
                <tr
                  key={row.id}
                  className={
                    service === "hajj_umrah_travelers"
                      ? "bg-gov-gray-100"
                      : "bg-white"
                  }
                >
                  <td className="whitespace-nowrap px-3 py-3 align-top text-gov-gray-700">
                    {content.governorate}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top text-gov-gray-700">
                    {fields.admin}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top text-gov-gray-700">
                    {serialDisplay}
                  </td>
                  <th
                    scope="row"
                    className="max-w-[160px] px-3 py-3 align-top font-medium text-gov-navy"
                    lang={locale === "fr" ? "fr" : "ar"}
                  >
                    {fields.name}
                  </th>
                  <td
                    className="min-w-[200px] px-3 py-3 align-top text-gov-gray-700"
                    lang={locale === "fr" ? "fr" : "ar"}
                  >
                    {fields.address}
                  </td>
                  <td className="min-w-[11rem] max-w-[14rem] px-3 py-3 align-top text-gov-gray-700">
                    {workingHours}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top font-mono text-gov-gray-700">
                    {row.phone ?? content.phoneMissing}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gov-accent underline-offset-2 hover:underline"
                    >
                      {content.mapsLink}
                    </a>
                  </td>
                  <td className="max-w-[11rem] px-3 py-3 align-top text-gov-gray-800">
                    {serviceLabel(service, content)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
