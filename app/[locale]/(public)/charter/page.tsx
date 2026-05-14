import { TravelerVaccinationsCharter } from "@/components/charter/TravelerVaccinationsCharter";
import { PageHeading } from "@/components/layout/PageHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { getTravelerVaccinationsOfficeCharter } from "@/data/traveler-vaccinations-office-charter";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return { title: m.pages.charter.metaTitle };
}

export default async function CharterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const m = getMessages(localeParam);
  const p = m.pages.charter;
  const charterDoc = getTravelerVaccinationsOfficeCharter(locale);

  return (
    <>
      <ScrollReveal initialVisible>
        <PageHeading title={p.heading} description={p.description} />
      </ScrollReveal>
      <ScrollReveal>
        <section
          className="border-y border-gov-gray-200 bg-gov-gray-50 py-14"
          aria-labelledby="charter-document-heading"
        >
          <div className="mx-auto max-w-6xl px-4">
            <TravelerVaccinationsCharter
              locale={locale}
              document={charterDoc}
              titleHeadingId="charter-document-heading"
              tocTitle={p.tocTitle}
            />
          </div>
        </section>
      </ScrollReveal>
    </>
  );
}
