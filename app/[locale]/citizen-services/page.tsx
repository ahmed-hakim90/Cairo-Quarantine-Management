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

  return (
    <>
      <PageHeading title={p.heading} description={p.description} />
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-10">
        <div className="rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="font-heading text-xl font-bold text-gov-navy">
            {p.vaccineTitle}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gov-gray-700">
            {p.vaccineBody}
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-gov-navy">
              {p.docsTitle}
            </h2>
            <ul className="mt-3 list-disc space-y-2 ps-6 text-sm leading-relaxed text-gov-gray-700">
              {p.docsBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-gov-navy">
              {p.notesTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gov-gray-700">
              {p.notesBody}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
