"use client";

import { useMemo, useState } from "react";
import {
  USER_CATEGORY_LABELS,
  VACCINES_BY_CATEGORY,
  type UserCategory,
  type VaccineRecord,
} from "@/data/vaccines";

const CATEGORY_ORDER: UserCategory[] = [
  "international",
  "hajj",
  "umrah",
  "citizen",
];

type VaccineSelectorProps = {
  /** Pre-select audience (e.g. on dedicated service pages) */
  initialCategory?: UserCategory;
  /** Anchor id for in-page links */
  sectionId?: string;
};

export function VaccineSelector({
  initialCategory = "international",
  sectionId = "vaccine-selector",
}: VaccineSelectorProps) {
  const [category, setCategory] = useState<UserCategory>(initialCategory);
  const [vaccineId, setVaccineId] = useState<string>(
    () => VACCINES_BY_CATEGORY[initialCategory][0]?.id ?? "",
  );

  const list: VaccineRecord[] = VACCINES_BY_CATEGORY[category];

  function handleCategoryChange(next: UserCategory) {
    setCategory(next);
    setVaccineId(VACCINES_BY_CATEGORY[next][0]?.id ?? "");
  }

  const selected = useMemo(
    () => list.find((v) => v.id === vaccineId) ?? list[0],
    [list, vaccineId],
  );

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
          استعلام القاحات والتكلفة التوجيهية
        </h2>
        <p className="mt-2 max-w-2xl text-gov-gray-600">
          اختر الفئة ثم نوع اللقاح لعرض السعر التوجيهي. قد تختلف التكلفة الفعلية
          بحسب السياسات المحدثة أو التغطية التأمينية.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="user-type"
                className="block text-sm font-semibold text-gov-navy"
              >
                نوع المستخدم
              </label>
              <select
                id="user-type"
                value={category}
                onChange={(e) =>
                  handleCategoryChange(e.target.value as UserCategory)
                }
                className="mt-2 min-h-14 w-full rounded-md border border-gov-gray-200 bg-white px-4 py-3 text-lg text-gov-gray-900 shadow-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/30"
              >
                {CATEGORY_ORDER.map((key) => (
                  <option key={key} value={key}>
                    {USER_CATEGORY_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="vaccine-type"
                className="block text-sm font-semibold text-gov-navy"
              >
                اللقاح
              </label>
              <select
                id="vaccine-type"
                value={selected?.id ?? ""}
                onChange={(e) => setVaccineId(e.target.value)}
                className="mt-2 min-h-14 w-full rounded-md border border-gov-gray-200 bg-white px-4 py-3 text-lg text-gov-gray-900 shadow-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/30"
              >
                {list.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="rounded-lg border border-gov-gray-200 bg-white p-8 shadow-sm"
            aria-live="polite"
          >
            <p className="text-sm font-semibold text-gov-gray-600">
              التكلفة التوجيهية
            </p>
            <p className="mt-2 font-heading text-lg font-bold text-gov-navy">
              {selected?.nameAr}
            </p>
            <div className="mt-6 border-t border-gov-gray-100 pt-6">
              {selected?.free ? (
                <p
                  className="font-heading text-4xl font-bold tracking-tight text-gov-accent sm:text-5xl"
                  lang="ar"
                >
                  مجاناً
                </p>
              ) : (
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className="font-heading text-4xl font-bold tabular-nums text-gov-navy sm:text-5xl">
                    {selected?.priceEgp?.toLocaleString("ar-EG")}
                  </span>
                  <span className="text-lg font-medium text-gov-gray-600">
                    جنيه مصري
                  </span>
                </p>
              )}
            </div>
            <p className="mt-6 text-sm leading-relaxed text-gov-gray-600">
              للحجز والدفع، يرجى مراجعة المركز المعتمد أو القنوات الرسمية عند
              ربط النظام بالخدمات الإلكترونية لاحقاً.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
