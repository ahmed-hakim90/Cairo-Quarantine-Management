import { HajjTravelerOfficesTable } from "@/components/hajj/HajjTravelerOfficesTable";
import { VaccineSelector } from "@/components/home/VaccineSelector";
import { PageHeading } from "@/components/layout/PageHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import {
  listOffices,
  listVaccinesByCategoryForPublic,
} from "@/lib/office-requests/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return { title: m.pages.citizen.metaTitle };
}

export default async function CitizenServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const m = getMessages(locale);
  const p = m.pages.citizen;
  const [vaccinesByCategory, offices] = await Promise.all([
    listVaccinesByCategoryForPublic(),
    listOffices(),
  ]);

  return (
    <>
      <ScrollReveal initialVisible>
        <PageHeading title={p.heading} description={p.description} />
      </ScrollReveal>
      <ScrollReveal>
        <section
          className="border-y border-gov-gray-200 bg-gov-gray-50 py-14"
          aria-labelledby="citizen-vaccines-heading"
        >
          <div className="mx-auto max-w-6xl px-4">
            <h2
              id="citizen-vaccines-heading"
              className="font-heading text-xl font-bold text-gov-navy sm:text-2xl"
            >
              {p.vaccineTitle}
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gov-gray-700">
              {p.vaccineBody}
            </p>
            <div
              className="mt-6 max-w-3xl"
              aria-labelledby="citizen-docs-inline-heading"
            >
              <h3
                id="citizen-docs-inline-heading"
                className="font-heading text-base font-bold text-gov-navy"
              >
                {p.docsTitle}
              </h3>
              <ul className="mt-3 list-disc space-y-2 ps-6 text-base leading-relaxed text-gov-gray-700">
                {p.docsBullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <VaccineSelector
              vaccinesByCategory={vaccinesByCategory}
              embedded
              initialCategory="citizen"
              allowedCategories={["citizen"]}
              sectionId="citizen-vaccine-selector"
              locale={locale}
              labels={m.vaccineSelector}
              bookingNav={{
                label: m.nav.bookVaccination,
                ariaLabel: m.nav.bookVaccinationAria,
              }}
            />
          </div>
        </section>
      </ScrollReveal>
      <ScrollReveal>
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="font-heading text-lg font-bold text-gov-navy">
              {p.notesTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gov-gray-700 md:text-base">
              {p.notesBody}
            </p>
          </div>
        </section>
      </ScrollReveal>
      <ScrollReveal>
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
            <p className="whitespace-pre-line text-sm leading-relaxed text-amber-900 md:text-base">
              {p.splenectomyNote}
            </p>
          </div>
        </section>
      </ScrollReveal>
      <ScrollReveal>
        <HajjTravelerOfficesTable
          content={m.hajjTable}
          locale={locale}
          offices={offices}
        />
      </ScrollReveal>
    </>
  );
}
