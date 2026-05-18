import { HajjTravelerOfficesTable } from "@/components/hajj/HajjTravelerOfficesTable";
import { VaccineSelector } from "@/components/home/VaccineSelector";
import { PageHeading } from "@/components/layout/PageHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { EPIDEMIOLOGICAL_STATUS_DOC_URL } from "@/data/epidemiological-status-doc";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import {
  listOffices,
  listVaccinesByCategoryForPublic,
} from "@/lib/office-requests/store";

function DocumentLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
      />
    </svg>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return { title: m.pages.international.metaTitle };
}

export default async function InternationalTravelerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const m = getMessages(locale);
  const p = m.pages.international;
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
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="font-heading text-xl font-bold text-gov-navy">
              {p.beforeTravel}
            </h2>
            <ul className="mt-4 list-disc space-y-2 ps-6 leading-relaxed text-gov-gray-700">
              {p.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-5 flex flex-wrap items-center gap-2 rounded-lg bg-gov-gray-50 px-4 py-3 leading-relaxed text-gov-gray-700">
              <span>{p.destinationVaccinesWhatsapp}</span>
              <a
                href={EPIDEMIOLOGICAL_STATUS_DOC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gov-accent text-white transition-transform hover:scale-105 focus-visible:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-accent active:scale-95"
                aria-label={p.destinationVaccinesWhatsappAria}
                title={p.destinationVaccinesWhatsappAria}
              >
                <DocumentLinkIcon className="size-5" />
              </a>
            </p>
          </div>
        </section>
      </ScrollReveal>
      <ScrollReveal>
        <VaccineSelector
          vaccinesByCategory={vaccinesByCategory}
          initialCategory="international"
          locale={locale}
          labels={m.vaccineSelector}
          bookingNav={{
            label: m.nav.bookVaccination,
            ariaLabel: m.nav.bookVaccinationAria,
          }}
        />
      </ScrollReveal>
      <ScrollReveal>
        <HajjTravelerOfficesTable
          content={m.hajjTable}
          locale={locale}
          offices={offices}
          serviceFilter="hajj_umrah_travelers"
        />
      </ScrollReveal>
    </>
  );
}
