"use client";

import { useId, useMemo, useState } from "react";
import { VACCINES_BY_CATEGORY } from "@/data/vaccines";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type TripKind = "hajj" | "umrah";

type HajjUmrahTripPricingProps = {
  locale: Locale;
  pricing: Messages["pages"]["hajj"]["pricing"];
  currencyLabel: string;
};

export function HajjUmrahTripPricing({
  locale,
  pricing,
  currencyLabel,
}: HajjUmrahTripPricingProps) {
  const selectId = useId();
  const [trip, setTrip] = useState<TripKind>("hajj");

  const primary = useMemo(
    () => VACCINES_BY_CATEGORY[trip][0],
    [trip],
  );

  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const vaccineName =
    locale === "en" ? primary.nameEn : primary.nameAr;

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
              className="rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm"
              aria-live="polite"
            >
              <p className="text-sm font-semibold text-gov-gray-600">
                {pricing.guidancePrice}
              </p>
              <p className="mt-2 font-heading text-lg font-bold text-gov-navy">
                {vaccineName}
              </p>
              <div className="mt-6 border-t border-gov-gray-100 pt-6">
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className="font-heading text-4xl font-bold tabular-nums text-gov-navy sm:text-5xl">
                    {primary.priceEgp?.toLocaleString(numberLocale)}
                  </span>
                  <span className="text-lg font-medium text-gov-gray-600">
                    {currencyLabel}
                  </span>
                </p>
              </div>
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
        </div>
      </div>
    </section>
  );
}
