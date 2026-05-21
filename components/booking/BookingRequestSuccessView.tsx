"use client";

import { BookingPassSuccessBlock } from "@/components/booking/BookingPassSuccessBlock";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { bookingRequestCopy } from "@/lib/i18n/booking-request-copy";
import type { Locale } from "@/lib/i18n/config";
import type { PublicOfficeRequestStatus } from "@/lib/office-requests/types";

type SuccessRequest = PublicOfficeRequestStatus & {
  phone: string;
  passToken?: string;
};

type BookingRequestSuccessViewProps = {
  locale: Locale;
  message: string;
  request: SuccessRequest;
  contactName?: string;
  serverSiteOrigin: string;
};

export function BookingRequestSuccessView({
  locale,
  message,
  request,
  contactName,
  serverSiteOrigin,
}: BookingRequestSuccessViewProps) {
  const t = bookingRequestCopy[locale];

  return (
    <div className="space-y-0" role="status">
      <div className="border-b border-gov-gray-200 px-5 py-4 md:px-7">
        <h2 className="font-heading text-lg font-extrabold text-gov-navy">
          {t.successTitle}
        </h2>
        <p className="mt-2 text-sm font-bold text-emerald-800">{message}</p>
      </div>

      <div className="space-y-5 px-5 py-5 md:px-7">
        <div>
          <h3 className="text-sm font-bold text-gov-navy">
            {t.successDetailsTitle}
          </h3>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md border border-gov-gray-200 bg-gov-gray-50 p-3">
              <dt className="font-bold text-gov-navy">{t.requestId}</dt>
              <dd className="mt-1 font-extrabold text-gov-accent">
                #{request.id}
              </dd>
            </div>
            <div className="rounded-md border border-gov-gray-200 bg-gov-gray-50 p-3">
              <dt className="font-bold text-gov-navy">{t.officeName}</dt>
              <dd className="mt-1 text-gov-gray-700">
                {request.officeNameAr || "-"}
              </dd>
            </div>
            {request.type === "booking" && request.preferredDate ? (
              <div className="rounded-md border border-gov-gray-200 bg-gov-gray-50 p-3">
                <dt className="font-bold text-gov-navy">{t.preferredDate}</dt>
                <dd className="mt-1 text-gov-gray-700">
                  {request.preferredDate}
                </dd>
              </div>
            ) : null}
            {contactName ? (
              <div className="rounded-md border border-gov-gray-200 bg-gov-gray-50 p-3">
                <dt className="font-bold text-gov-navy">{t.name}</dt>
                <dd className="mt-1 text-gov-gray-700">{contactName}</dd>
              </div>
            ) : null}
            <div className="rounded-md border border-gov-gray-200 bg-gov-gray-50 p-3">
              <dt className="font-bold text-gov-navy">{t.phone}</dt>
              <dd className="mt-1 text-gov-gray-700" dir="ltr">
                {request.phone}
              </dd>
            </div>
          </dl>
        </div>

        <LocaleLink
          locale={locale}
          href="/my-requests"
          className="inline-flex min-h-10 items-center rounded-md bg-gov-accent px-4 text-sm font-bold text-white transition hover:bg-gov-navy"
        >
          {t.followRequests}
        </LocaleLink>

        {request.type === "booking" && request.passToken ? (
          <BookingPassSuccessBlock
            locale={locale}
            request={
              request as PublicOfficeRequestStatus & {
                phone: string;
                passToken: string;
              }
            }
            serverSiteOrigin={serverSiteOrigin}
          />
        ) : null}
      </div>
    </div>
  );
}
