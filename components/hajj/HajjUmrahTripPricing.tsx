"use client";

import { useId, useState } from "react";
import type { VaccineRecord } from "@/data/vaccines";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { getVaccinationBookingFormUrl } from "@/lib/site-booking";

type TripKind = "hajj" | "umrah";

type HajjUmrahTripPricingProps = {
  locale: Locale;
  pricing: Messages["pages"]["hajj"]["pricing"];
  currencyLabel: string;
  vaccinesByCategory: {
    hajj: VaccineRecord[];
    umrah: VaccineRecord[];
  };
  freeLabel: string;
  bookingNav?: { label: string; ariaLabel: string };
};

function vaccineName(record: VaccineRecord, locale: Locale): string {
  return locale === "ar" ? record.nameAr : record.nameEn;
}

function VaccinePriceRow({
  vaccine,
  locale,
  currencyLabel,
  freeLabel,
  numberLocale,
  langAttr,
}: {
  vaccine: VaccineRecord;
  locale: Locale;
  currencyLabel: string;
  freeLabel: string;
  numberLocale: string;
  langAttr: string;
}) {
  return (
    <li className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="font-medium text-gov-navy">
        {vaccineName(vaccine, locale)}
      </span>
      {vaccine.free ? (
        <span
          className="text-lg font-semibold text-gov-accent tabular-nums"
          lang={langAttr}
        >
          {freeLabel}
        </span>
      ) : (
        <span className="flex shrink-0 items-baseline gap-1.5 tabular-nums">
          <span className="text-lg font-semibold text-gov-gray-900">
            {vaccine.priceEgp?.toLocaleString(numberLocale) ?? "—"}
          </span>
          <span className="text-sm font-medium text-gov-gray-600">
            {currencyLabel}
          </span>
        </span>
      )}
    </li>
  );
}

export function HajjUmrahTripPricing({
  locale,
  pricing,
  currencyLabel,
  vaccinesByCategory,
  freeLabel,
  bookingNav,
}: HajjUmrahTripPricingProps) {
  const selectId = useId();
  const [trip, setTrip] = useState<TripKind>("hajj");
  const bookingUrl = getVaccinationBookingFormUrl(locale);

  const activeVaccines = vaccinesByCategory[trip];

  const numberLocale =
    locale === "ar" ? "ar-EG" : locale === "zh" ? "zh-CN" : "en-US";
  const langAttr =
    locale === "ar" ? "ar" : locale === "zh" ? "zh-CN" : "en";

  const rowProps = {
    locale,
    currencyLabel,
    freeLabel,
    numberLocale,
    langAttr,
  };

  return (
    <section
      className="border-y border-gov-gray-200 bg-white py-12"
      aria-labelledby="hajj-trip-pricing-heading"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2
          id="hajj-trip-pricing-heading"
          className="font-heading text-2xl font-bold text-gov-navy sm:text-3xl"
        >
          {pricing.sectionTitle}
        </h2>

        <div className="mt-8 rounded-lg border border-gov-gray-200 bg-gov-gray-50 p-6 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <label
                htmlFor={selectId}
                className="block text-sm font-semibold text-gov-navy"
              >
                {pricing.tripTypeLabel}
              </label>
              <select
                id={selectId}
                value={trip}
                onChange={(e) => setTrip(e.target.value as TripKind)}
                className="mt-2 min-h-14 w-full rounded-md border border-gov-gray-200 bg-white px-4 py-3 text-lg text-gov-gray-900 shadow-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/30"
              >
                <option value="hajj">{pricing.tripHajj}</option>
                <option value="umrah">{pricing.tripUmrah}</option>
              </select>
            </div>

            <div
              className="rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm md:p-8"
              aria-live="polite"
            >
              <p className="text-sm font-semibold text-gov-gray-600">
                {pricing.guidancePrice}
              </p>

              {activeVaccines.length === 0 ? (
                <p className="mt-4 text-base leading-relaxed text-gov-gray-700">
                  —
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {activeVaccines.map((v) => (
                    <VaccinePriceRow key={v.id} vaccine={v} {...rowProps} />
                  ))}
                </ul>
              )}
            </div>
          </div>

          <p className="mt-8 text-sm leading-relaxed text-gov-gray-700">
            {pricing.fluDisclaimer}
          </p>

          <div className="mt-8 border-t border-gov-gray-200 pt-8">
            <h3 className="font-heading text-lg font-bold text-gov-navy">
              {pricing.locationsTitle}
            </h3>
            <p className="mt-3 leading-relaxed text-gov-gray-700">
              {pricing.locationsBody}
            </p>
          </div>

          {bookingUrl && bookingNav ? (
            <div className="mt-8 flex justify-center border-t border-gov-gray-200 pt-8">
              <a
                href={bookingUrl}
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-gov-accent px-8 py-3 text-center text-base font-semibold text-white shadow-md transition-colors hover:bg-gov-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-navy"
                aria-label={bookingNav.ariaLabel}
              >
                {bookingNav.label}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
