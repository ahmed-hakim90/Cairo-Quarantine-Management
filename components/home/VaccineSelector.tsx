"use client";

import { useMemo, useState } from "react";
import {
  VACCINES_BY_CATEGORY,
  type UserCategory,
  type VaccineRecord,
} from "@/data/vaccines";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

const CATEGORY_ORDER: UserCategory[] = [
  "international",
  "hajj",
  "umrah",
  "citizen",
];

type VaccineSelectorProps = {
  /** Pre-select audience (e.g. on dedicated service pages) */
  initialCategory?: UserCategory;
  /** If set, only these audiences appear in the dropdown */
  allowedCategories?: UserCategory[];
  /** Anchor id for in-page links */
  sectionId?: string;
  /**
   * When true, renders only the lookup grid (no outer band heading).
   * Wrap with your own section + title — used on citizen-services page.
   */
  embedded?: boolean;
  locale: Locale;
  labels: Messages["vaccineSelector"];
};

function vaccineName(record: VaccineRecord, locale: Locale): string {
  return locale === "ar" ? record.nameAr : record.nameEn;
}

function idsFromCategory(cat: UserCategory): Set<string> {
  const first = VACCINES_BY_CATEGORY[cat][0]?.id;
  return new Set(first ? [first] : []);
}

export function VaccineSelector({
  initialCategory = "international",
  allowedCategories,
  sectionId = "vaccine-selector",
  embedded = false,
  locale,
  labels,
}: VaccineSelectorProps) {
  const categoryOrder = useMemo(() => {
    if (!allowedCategories?.length) return CATEGORY_ORDER;
    return CATEGORY_ORDER.filter((c) => allowedCategories.includes(c));
  }, [allowedCategories]);

  const resolvedInitial = useMemo((): UserCategory => {
    if (categoryOrder.includes(initialCategory)) return initialCategory;
    return categoryOrder[0] ?? initialCategory;
  }, [initialCategory, categoryOrder]);

  const [category, setCategory] = useState<UserCategory>(resolvedInitial);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    idsFromCategory(resolvedInitial),
  );

  const list: VaccineRecord[] = VACCINES_BY_CATEGORY[category];

  function handleCategoryChange(next: UserCategory) {
    setCategory(next);
    setSelectedIds(idsFromCategory(next));
  }

  function toggleVaccine(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedRecords = useMemo(
    () => list.filter((v) => selectedIds.has(v.id)),
    [list, selectedIds],
  );

  const indicativeTotal = useMemo(
    () =>
      selectedRecords.reduce((sum, v) => {
        if (v.free) return sum;
        return sum + (v.priceEgp ?? 0);
      }, 0),
    [selectedRecords],
  );

  const summaryText =
    selectedIds.size === 0
      ? labels.vaccinesSummaryNone
      : labels.vaccinesSummaryCount.replace(
          "{count}",
          String(selectedIds.size),
        );

  const numberLocale =
    locale === "ar" ? "ar-EG" : locale === "zh" ? "zh-CN" : "en-US";

  const langAttr =
    locale === "ar" ? "ar" : locale === "zh" ? "zh-CN" : "en";

  const userTypeId = `${sectionId}-user-type`;
  const vaccineFieldLabelId = `${sectionId}-vaccine-field-label`;
  const showAudienceSelect = categoryOrder.length > 1;

  const lookupGrid = (
    <>
      <div className="space-y-6">
        {showAudienceSelect ? (
          <div>
            <label
              htmlFor={userTypeId}
              className="block text-sm font-semibold text-gov-navy"
            >
              {labels.userType}
            </label>
            <select
              id={userTypeId}
              value={category}
              onChange={(e) =>
                handleCategoryChange(e.target.value as UserCategory)
              }
              className="mt-2 min-h-14 w-full rounded-md border border-gov-gray-200 bg-white px-4 py-3 text-lg text-gov-gray-900 shadow-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/30"
            >
              {categoryOrder.map((key) => (
                <option key={key} value={key}>
                  {labels.categories[key]}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <span
            id={vaccineFieldLabelId}
            className="block text-sm font-semibold text-gov-navy"
          >
            {labels.vaccine}
          </span>
              <p className="mt-1 text-sm text-gov-gray-600">
                {labels.vaccinesDropdownHint}
              </p>
              <details className="group mt-2 overflow-hidden rounded-md border border-gov-gray-200 bg-white shadow-sm open:ring-2 open:ring-gov-accent/25">
                <summary
                  className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 text-lg text-gov-gray-900 outline-none marker:hidden [&::-webkit-details-marker]:hidden focus-visible:ring-2 focus-visible:ring-gov-accent/40"
                  aria-describedby={vaccineFieldLabelId}
                >
                  <span className="min-w-0 flex-1 truncate text-start">
                    {summaryText}
                  </span>
                  <svg
                    className="h-5 w-5 shrink-0 text-gov-gray-500 transition-transform duration-200 group-open:rotate-180 rtl:-scale-x-100"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </summary>
                <fieldset className="m-0 border-0 border-t border-gov-gray-100 p-0">
                  <legend className="sr-only">{labels.vaccine}</legend>
                  <div className="max-h-64 space-y-0 overflow-y-auto p-2">
                    {list.map((v) => {
                      const checked = selectedIds.has(v.id);
                      return (
                        <label
                          key={v.id}
                          className="flex cursor-pointer items-start gap-3 rounded-md px-3 py-3 text-base leading-snug text-gov-gray-900 hover:bg-gov-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleVaccine(v.id)}
                            className="mt-1 size-4 shrink-0 rounded border-gov-gray-300 text-gov-accent focus:ring-gov-accent/40"
                          />
                          <span className="min-w-0 flex-1">
                            {vaccineName(v, locale)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </details>
        </div>
      </div>

      <div
        className="rounded-lg border border-gov-gray-200 bg-white p-8 shadow-sm"
        aria-live="polite"
      >
        <p className="text-sm font-semibold text-gov-gray-600">
          {labels.guidancePrice}
        </p>

        {selectedRecords.length === 0 ? (
          <p className="mt-4 text-base leading-relaxed text-gov-gray-700">
            {labels.vaccinesEmptySelection}
          </p>
        ) : (
          <>
            <ul className="mt-4 space-y-4 border-b border-gov-gray-100 pb-6">
              {selectedRecords.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <span className="font-medium text-gov-navy">
                    {vaccineName(v, locale)}
                  </span>
                  {v.free ? (
                    <span
                      className="text-lg font-semibold text-gov-accent tabular-nums"
                      lang={langAttr}
                    >
                      {labels.free}
                    </span>
                  ) : (
                    <span className="flex shrink-0 items-baseline gap-1.5 tabular-nums">
                      <span className="text-lg font-semibold text-gov-gray-900">
                        {v.priceEgp?.toLocaleString(numberLocale)}
                      </span>
                      <span className="text-sm font-medium text-gov-gray-600">
                        {labels.currency}
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="text-sm font-semibold text-gov-gray-600">
                {labels.vaccinesTotal}
              </p>
              <p className="flex flex-wrap items-baseline gap-2">
                <span className="font-heading text-3xl font-bold tabular-nums text-gov-navy sm:text-4xl">
                  {indicativeTotal.toLocaleString(numberLocale)}
                </span>
                <span className="text-lg font-medium text-gov-gray-600">
                  {labels.currency}
                </span>
              </p>
            </div>
          </>
        )}

        <p className="mt-6 text-sm leading-relaxed text-gov-gray-600">
          {labels.footnote}
        </p>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div
        id={sectionId}
        className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-start"
      >
        {lookupGrid}
      </div>
    );
  }

  return (
    <section
      id={sectionId}
      className="border-y border-gov-gray-200 bg-gov-gray-50 py-14"
      aria-labelledby="vaccine-selector-heading"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2
          id="vaccine-selector-heading"
          className="font-heading text-2xl font-bold text-gov-navy sm:text-3xl"
        >
          {labels.heading}
        </h2>
        <p className="mt-2 max-w-2xl text-gov-gray-600">{labels.intro}</p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-start">
          {lookupGrid}
        </div>
      </div>
    </section>
  );
}
