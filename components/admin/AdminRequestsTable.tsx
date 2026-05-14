"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  TRAVELER_CATEGORY_LABELS,
  type OfficeRequest,
  type TravelerCategory,
} from "@/lib/office-requests/types";

const TRAVELER_FILTER_KEYS = [
  "international",
  "hajj_umrah",
  "citizen",
] as const satisfies readonly TravelerCategory[];

type RequestTypeFilter = "all" | "complaint" | "proposal";

const TYPE_TABS: { id: RequestTypeFilter; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "complaint", label: "شكاوى فقط" },
  { id: "proposal", label: "مقترحات فقط" },
];

type AdminRequestsTableProps = {
  requests: OfficeRequest[];
  locale: string;
};

const statusClass: Record<OfficeRequest["status"], string> = {
  new: "bg-blue-50 text-blue-800 ring-blue-100",
  in_progress: "bg-amber-50 text-amber-800 ring-amber-100",
  contacted: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  completed: "bg-gov-accent-muted text-gov-navy ring-gov-accent-muted",
  cancelled: "bg-red-50 text-red-800 ring-red-100",
};

const tagBaseClass =
  "inline-flex min-h-9 items-center justify-center rounded-md px-3 py-1.5 text-xs font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-accent/40";

function StatusBadge({ status }: { status: OfficeRequest["status"] }) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-extrabold ring-1 ${statusClass[status]}`}
    >
      {REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

function BookingMeta({ request }: { request: OfficeRequest }) {
  if (request.type !== "booking") return null;

  const category = request.travelerCategory
    ? TRAVELER_CATEGORY_LABELS[request.travelerCategory]
    : null;

  return (
    <span className="mt-1 block text-xs leading-relaxed text-gov-gray-600">
      {[category, request.preferredDate].filter(Boolean).join(" - ") || "-"}
    </span>
  );
}

function emptyMessage(
  typeFilter: RequestTypeFilter,
  activeCategory: TravelerCategory | null,
): string {
  if (typeFilter === "complaint") {
    return "لا توجد شكاوى ضمن آخر 200 طلباً محمّلة.";
  }
  if (typeFilter === "proposal") {
    return "لا توجد مقترحات ضمن آخر 200 طلباً محمّلة.";
  }
  if (activeCategory !== null) {
    return "لا توجد حجوزات مطابقة لهذه الفئة ضمن القائمة.";
  }
  return "لا توجد طلبات مطابقة للتصفية الحالية.";
}

export function AdminRequestsTable({ requests, locale }: AdminRequestsTableProps) {
  const [typeFilter, setTypeFilter] = useState<RequestTypeFilter>("all");
  const [activeCategory, setActiveCategory] = useState<TravelerCategory | null>(
    null,
  );

  const filteredRequests = useMemo(() => {
    let list =
      typeFilter === "all"
        ? requests
        : requests.filter((r) => r.type === typeFilter);
    if (activeCategory !== null) {
      list = list.filter(
        (request) =>
          request.type !== "booking" ||
          request.travelerCategory === activeCategory,
      );
    }
    return list;
  }, [requests, typeFilter, activeCategory]);

  return (
    <div className="rounded-lg border border-gov-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-gov-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-lg font-bold text-gov-navy">
          أحدث الطلبات
        </h2>
        <div className="text-sm text-gov-gray-600 sm:text-end">
          <p>آخر 200 طلب حسب الصلاحية</p>
          <p className="mt-1 text-xs leading-relaxed text-gov-gray-500">
            عند اختيار «شكاوى» أو «مقترحات» يُعرض ما يطابق التبويب ضمن هذه
            القائمة فقط.
          </p>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2 border-b border-gov-gray-200 px-4 py-3"
        role="tablist"
        aria-label="تصفية الطلبات حسب النوع"
      >
        {TYPE_TABS.map((tab) => {
          const selected = typeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTypeFilter(tab.id)}
              className={
                selected
                  ? "inline-flex min-h-9 items-center rounded-md bg-gov-navy px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-gov-navy/90"
                  : "inline-flex min-h-9 items-center rounded-md border border-gov-gray-200 bg-white px-3.5 py-1.5 text-xs font-extrabold text-gov-navy transition hover:bg-gov-gray-50"
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        className="border-b border-gov-gray-200 px-4 py-3"
        role="group"
        aria-label="تصفية حجوزات المسافرين حسب الفئة"
      >
        <p className="mb-2 text-xs font-bold text-gov-gray-600">
          تصفية الحجوزات حسب فئة المسافر (اختياري)
        </p>
        <div className="flex flex-wrap gap-2">
          {TRAVELER_FILTER_KEYS.map((key) => {
            const pressed = activeCategory === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={pressed}
                onClick={() =>
                  setActiveCategory((prev) => (prev === key ? null : key))
                }
                className={`${tagBaseClass} ${
                  pressed
                    ? "border border-gov-accent bg-gov-accent-muted text-gov-navy ring-1 ring-gov-accent/30"
                    : "border border-gov-gray-200 bg-white text-gov-navy hover:bg-gov-gray-50"
                }`}
              >
                {TRAVELER_CATEGORY_LABELS[key]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gov-gray-200 text-sm">
          <thead className="bg-gov-gray-50 text-gov-navy">
            <tr>
              <th className="px-4 py-3 text-start">الاسم</th>
              <th className="px-4 py-3 text-start">الهاتف</th>
              <th className="px-4 py-3 text-start">المكتب</th>
              <th className="px-4 py-3 text-start">النوع</th>
              <th className="px-4 py-3 text-start">الحالة</th>
              <th className="px-4 py-3 text-start">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gov-gray-100">
            {requests.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gov-gray-600"
                >
                  لا توجد طلبات حالياً.
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gov-gray-600"
                >
                  {emptyMessage(typeFilter, activeCategory)}
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gov-gray-50/70">
                  <td className="px-4 py-3 font-bold text-gov-navy">
                    {request.name}
                  </td>
                  <td className="px-4 py-3">{request.phone}</td>
                  <td className="px-4 py-3">{request.officeNameAr}</td>
                  <td className="px-4 py-3">
                    {REQUEST_TYPE_LABELS[request.type]}
                    <BookingMeta request={request} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/${locale}/admin/requests/${request.id}`}
                      className="inline-flex min-h-9 items-center rounded-md border border-gov-gray-200 px-3 text-xs font-extrabold text-gov-navy transition hover:border-gov-accent hover:text-gov-accent"
                    >
                      التفاصيل
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
