import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BookingRequestForm } from "@/components/booking/BookingRequestForm";
import { RequestModeSwitcher } from "@/components/booking/RequestModeSwitcher";
import { inferredSiteOriginFromHeaders } from "@/lib/booking-pass-url";
import { isLocale } from "@/lib/i18n/config";
import { getBookingSettings, listOffices, listTravelerStatesForPublicBooking } from "@/lib/office-requests/store";

export const metadata: Metadata = {
  title: "حجز موعد تطعيم / شكوى",
};

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [offices, travelerStates] = await Promise.all([
    listOffices(),
    listTravelerStatesForPublicBooking(),
  ]);
  const bookingSettings = await getBookingSettings();
  const headerList = await headers();
  const serverSiteOrigin = inferredSiteOriginFromHeaders(headerList);

  return (
    <section className="bg-gov-gray-50">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[0.78fr_1.22fr] lg:py-12">
        <aside className="order-2 self-start lg:order-none">
          <p className="text-sm font-bold text-gov-accent">
            إدارة الحجر الصحي بالقاهرة
          </p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight text-gov-navy md:text-4xl">
            حجز موعد تطعيم أو شكوى بالمكتب المختص
          </h1>
          <p className="mt-4 leading-relaxed text-gov-gray-700">
            اختار المكتب ونوع المسافر والتاريخ الذي ترغب في الذهاب فيه، وسيظهر الحجز فوراً في لوحة المكتب لمتابعته واتساب.
          </p>
          <dl className="mt-6 grid gap-3 text-sm">
            <div className="rounded-md border border-gov-gray-200 bg-white p-4">
              <dt className="font-bold text-gov-navy">عدد المكاتب المتاحة</dt>
              <dd className="mt-1 text-2xl font-extrabold text-gov-accent">
                {offices.length}
              </dd>
            </div>
            <div className="rounded-md border border-gov-gray-200 bg-white p-4">
              <dt className="font-bold text-gov-navy">بيانات مطلوبة</dt>
              <dd className="mt-1 text-gov-gray-600">
                الاسم، رقم الهاتف، المكتب، حالة المسافر، والتاريخ المطلوب.
              </dd>
            </div>
          </dl>
        </aside>
        <div className="order-1 space-y-4 lg:order-none">
          <RequestModeSwitcher locale={locale} activeMode="booking" />
          <div className="rounded-lg border border-gov-gray-200 bg-white shadow-sm">
            <BookingRequestForm
              offices={offices}
              travelerStates={travelerStates}
              locale={locale}
              mode="booking"
              sameDayCutoffHour={bookingSettings.bookingSameDayCutoffHour}
              serverSiteOrigin={serverSiteOrigin}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
