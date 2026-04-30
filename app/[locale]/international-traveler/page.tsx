import { VaccineSelector } from "@/components/home/VaccineSelector";
import { PageHeading } from "@/components/layout/PageHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
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
          </div>
        </section>
      </ScrollReveal>
      <ScrollReveal>
        <VaccineSelector
          initialCategory="international"
          locale={locale}
          labels={m.vaccineSelector}
        />
      </ScrollReveal>
    </>
  );
}
