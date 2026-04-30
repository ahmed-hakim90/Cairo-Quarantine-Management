import { HajjUmrahTripPricing } from "@/components/hajj/HajjUmrahTripPricing";
import { HajjTravelerOfficesTable } from "@/components/hajj/HajjTravelerOfficesTable";
import { VaccineSelector } from "@/components/home/VaccineSelector";
import { PageHeading } from "@/components/layout/PageHeading";
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
  return { title: m.pages.hajj.metaTitle };
}

export default async function HajjUmrahPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const m = getMessages(locale);
  const p = m.pages.hajj;

  return (
    <>
      <PageHeading title={p.heading} description={p.description} />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="font-heading text-xl font-bold text-gov-navy">
            {p.basicsTitle}
          </h2>
          <p className="mt-4 leading-relaxed text-gov-gray-700">{p.basicsBody}</p>
        </div>
      </section>
      <HajjUmrahTripPricing
        locale={locale}
        pricing={p.pricing}
        currencyLabel={m.vaccineSelector.currency}
      />
      <section className="mx-auto max-w-6xl px-4 pb-4 pt-2">
        <h2 className="font-heading text-xl font-bold text-gov-navy">
          {p.umrahPathTitle}
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-gov-gray-700">
          {p.umrahPathBody}
        </p>
      </section>
      <VaccineSelector
        initialCategory="hajj"
        allowedCategories={["hajj", "umrah"]}
        locale={locale}
        labels={m.vaccineSelector}
      />
      <HajjTravelerOfficesTable content={m.hajjTable} />
      <section
        id="instructions"
        className="mx-auto max-w-6xl px-4 py-14"
        aria-labelledby="hajj-instructions-heading"
      >
        <h2
          id="hajj-instructions-heading"
          className="font-heading text-2xl font-bold text-gov-navy"
        >
          {p.instructionsTitle}
        </h2>
        <div className="mt-6 space-y-4 leading-relaxed text-gov-gray-700">
          {p.instructions.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </>
  );
}
