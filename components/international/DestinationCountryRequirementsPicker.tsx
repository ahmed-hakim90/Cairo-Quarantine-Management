"use client";

import { Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { findDestinationCountry } from "@/lib/chat/destination-country-response";
import type { DestinationCountry } from "@/lib/office-requests/types";
import type { Messages } from "@/lib/i18n/messages";

type CountryRequirementsLabels =
  Messages["pages"]["international"]["countryRequirements"];

type DestinationCountryRequirementsPickerProps = {
  countries: DestinationCountry[];
  intro: string;
  labels: CountryRequirementsLabels;
  initialCountryId?: string | null;
  initialCountryQuery?: string | null;
};

function countryDisplayLabel(country: DestinationCountry): string {
  return `${country.nameEn} - ${country.nameAr}`;
}

function matchesQuery(country: DestinationCountry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    country.nameEn.toLowerCase().includes(q) ||
    country.nameAr.includes(query.trim()) ||
    countryDisplayLabel(country).toLowerCase().includes(q)
  );
}

function scrollPickerIntoView(root: HTMLDivElement | null) {
  const delays = [0, 100, 250, 500, 800, 1200];
  return delays.map((ms) =>
    window.setTimeout(() => {
      root?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, ms),
  );
}

function DestinationCountryRequirementsPickerInner({
  countries,
  intro,
  labels,
  initialCountryId = null,
  initialCountryQuery = null,
}: DestinationCountryRequirementsPickerProps) {
  const listId = useId();
  const inputId = `${listId}-input`;
  const rootRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<DestinationCountry | null>(null);

  const filtered = useMemo(
    () => countries.filter((c) => matchesQuery(c, query)),
    [countries, query],
  );

  const showList = open && query.trim().length > 0 && filtered.length > 0;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const selectCountry = useCallback((country: DestinationCountry) => {
    setSelected(country);
    setQuery(countryDisplayLabel(country));
    setOpen(false);
  }, []);

  useEffect(() => {
    const countryId = initialCountryId?.trim() || null;
    const countryQuery = initialCountryQuery?.trim() || null;
    if (!countryId && !countryQuery) return;

    let country: DestinationCountry | undefined;
    if (countryId) {
      country = countries.find((c) => c.id === countryId);
    } else if (countryQuery) {
      country = findDestinationCountry(countryQuery, countries) ?? undefined;
    }
    if (!country) return;

    selectCountry(country);
    const timers = scrollPickerIntoView(rootRef.current);
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [countries, initialCountryId, initialCountryQuery, selectCountry]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showList && event.key !== "Escape") return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setOpen(true);
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (event.key === "Enter" && filtered[activeIndex]) {
        event.preventDefault();
        selectCountry(filtered[activeIndex]!);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    },
    [activeIndex, filtered, selectCountry, showList],
  );

  if (countries.length === 0) {
    return (
      <div
        id="destination-country-requirements"
        className="mt-5 scroll-mt-24 rounded-lg bg-gov-gray-50 px-4 py-3 text-base leading-relaxed text-gov-gray-700 md:text-lg"
      >
        <p>{intro}</p>
        <p className="mt-2 text-base text-amber-800">{labels.emptyCatalog}</p>
      </div>
    );
  }

  return (
    <div
      id="destination-country-requirements"
      ref={rootRef}
      className="mt-5 scroll-mt-24 rounded-lg bg-gov-gray-50 px-4 py-4 text-base leading-relaxed text-gov-gray-700 md:text-lg"
    >
      <p className="mb-3">{intro}</p>

      <label htmlFor={inputId} className="sr-only">
        {labels.selectAria}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
            if (selected && e.target.value !== countryDisplayLabel(selected)) {
              setSelected(null);
            }
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={labels.searchPlaceholder}
          className="min-h-12 w-full rounded-md border border-gov-gray-300 bg-white px-3 py-2 text-base text-gov-navy shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-accent md:text-lg"
          role="combobox"
          aria-expanded={showList}
          aria-controls={showList ? `${listId}-listbox` : undefined}
          aria-activedescendant={
            showList ? `${listId}-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          autoComplete="off"
        />

        {showList ? (
          <ul
            id={`${listId}-listbox`}
            role="listbox"
            aria-label={labels.listAria}
            className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gov-gray-200 bg-white py-1 shadow-lg"
          >
            {filtered.map((country, index) => (
              <li
                key={country.id}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`cursor-pointer px-3 py-2.5 text-base md:text-lg ${
                  index === activeIndex
                    ? "bg-gov-accent/15 font-bold text-gov-navy"
                    : "text-gov-gray-800 hover:bg-gov-gray-50"
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCountry(country)}
              >
                {countryDisplayLabel(country)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {open && query.trim() && filtered.length === 0 ? (
        <p className="mt-2 text-base text-gov-gray-600">{labels.noResults}</p>
      ) : null}

      {selected ? (
        <div
          className="mt-4 rounded-md border border-gov-accent/30 bg-white px-4 py-3"
          role="region"
          aria-live="polite"
        >
          <p className="text-base font-bold text-gov-navy md:text-lg">
            {labels.requirementsHeading}
          </p>
          <p className="mt-2 text-base leading-relaxed text-gov-gray-800 md:text-lg">
            {selected.requirementsAr}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function DestinationCountryRequirementsPickerFromParams(
  props: Omit<
    DestinationCountryRequirementsPickerProps,
    "initialCountryId" | "initialCountryQuery"
  >,
) {
  const searchParams = useSearchParams();
  const initialCountryId = searchParams.get("country");
  const initialCountryQuery = searchParams.get("q");
  return (
    <DestinationCountryRequirementsPickerInner
      {...props}
      initialCountryId={initialCountryId}
      initialCountryQuery={initialCountryQuery}
    />
  );
}

export function DestinationCountryRequirementsPicker(
  props: Omit<
    DestinationCountryRequirementsPickerProps,
    "initialCountryId" | "initialCountryQuery"
  >,
) {
  return (
    <Suspense
      fallback={
        <DestinationCountryRequirementsPickerInner
          {...props}
          initialCountryId={null}
          initialCountryQuery={null}
        />
      }
    >
      <DestinationCountryRequirementsPickerFromParams {...props} />
    </Suspense>
  );
}
