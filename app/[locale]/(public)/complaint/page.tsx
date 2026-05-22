import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BookingRequestForm } from "@/components/booking/BookingRequestForm";
import { RequestModeSwitcher } from "@/components/booking/RequestModeSwitcher";
import { inferredSiteOriginFromHeaders } from "@/lib/booking-pass-url";
import { bookingPageCopy } from "@/lib/i18n/booking-request-copy";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { listOffices } from "@/lib/office-requests/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = isLocale(locale) ? locale : "ar";
  return { title: bookingPageCopy[resolvedLocale].complaintMetaTitle };
}

export default async function ComplaintPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const copy = bookingPageCopy[resolvedLocale];

  const offices = await listOffices();
  const headerList = await headers();
  const serverSiteOrigin = inferredSiteOriginFromHeaders(headerList);

  return (
    <section className="bg-gov-gray-50">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:gap-8 sm:py-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-8 lg:py-12">
        <aside className="order-2 self-start lg:order-none">
          <p className="text-sm font-bold text-gov-accent">
            {copy.siteName}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight text-gov-navy md:text-4xl">
            {copy.complaintHeading}
          </h1>
          <p className="mt-4 leading-relaxed text-gov-gray-700">
            {copy.complaintIntro}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm max-sm:mt-4 lg:grid-cols-1">
            <div className="rounded-md border border-gov-gray-200 bg-white p-4">
              <dt className="font-bold text-gov-navy">{copy.officesCount}</dt>
              <dd className="mt-1 text-2xl font-extrabold text-gov-accent">
                {offices.length}
              </dd>
            </div>
            <div className="rounded-md border border-gov-gray-200 bg-white p-4">
              <dt className="font-bold text-gov-navy">{copy.requiredData}</dt>
              <dd className="mt-1 text-gov-gray-600">
                {copy.complaintRequiredData}
              </dd>
            </div>
          </dl>
        </aside>
        <div className="order-1 space-y-4 lg:order-none">
          <RequestModeSwitcher locale={resolvedLocale} activeMode="complaint" />
          <div className="rounded-lg border border-gov-gray-200 bg-white shadow-sm max-sm:-mx-4 max-sm:rounded-none max-sm:border-x-0">
            <BookingRequestForm
              offices={offices}
              locale={resolvedLocale}
              mode="complaint"
              serverSiteOrigin={serverSiteOrigin}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
