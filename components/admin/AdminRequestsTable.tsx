"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  defaultTravelerStatesFromLegacyLabels,
  effectiveTravelerStateIdOnRequest,
  mergeTravelerStateLabelsWithLegacy,
} from "@/lib/office-requests/office-traveler-state";
import {
  buildAdminRequestsHref,
  type AdminRequestsHrefParams,
  type AdminRequestsSort,
  type AdminRequestsStatusFilter,
} from "@/lib/office-requests/requests-list-params";
import {
  dateInputClass,
  segmentClass,
  SEGMENT_TRAY,
} from "@/components/admin/admin-filter-segments";
import type { AdminBookingDateRange } from "@/lib/office-requests/admin-booking-date-range";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  type AdminActivityLogEntry,
  type OfficeRequest,
  type OfficeRequestStatus,
  type TravelerState,
} from "@/lib/office-requests/types";

export type AdminRequestsDateRange = AdminBookingDateRange;

type RequestTypeFilter = "all" | "booking" | "complaint";

const TYPE_TABS: { id: RequestTypeFilter; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "booking", label: "الحجوزات" },
  { id: "complaint", label: "الشكاوى" },
];

const STATUS_OPTIONS: {
  value: AdminRequestsStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "الكل" },
  ...(Object.entries(REQUEST_STATUS_LABELS) as [OfficeRequestStatus, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

const SORT_OPTIONS: { value: AdminRequestsSort; label: string }[] = [
  { value: "created_desc", label: "الأحدث إنشاءً" },
  { value: "created_asc", label: "الأقدم إنشاءً" },
  { value: "updated_desc", label: "الأحدث تحديثًا" },
  { value: "updated_asc", label: "الأقدم تحديثًا" },
];

const filterSelectClass =
  "min-h-9 w-full min-w-0 rounded-md border border-gov-gray-200 bg-white px-2 text-xs font-bold text-gov-navy outline-none transition focus:border-gov-accent focus:ring-2 focus:ring-gov-accent/20 sm:min-w-[8.5rem] sm:shrink-0";

function typeTabCountClass(tabId: RequestTypeFilter): string {
  if (tabId === "all") {
    return "tabular-nums font-black text-red-600";
  }
  if (tabId === "booking") {
    return "tabular-nums font-black text-amber-700";
  }
  return "tabular-nums font-black text-sky-800";
}

type AdminRequestsTableProps = {
  requests: OfficeRequest[];
  locale: string;
  travelerStates: TravelerState[];
  /** مسار قائمة الطلبات بدون query (مثل `/${locale}/admin/requests`). */
  requestsListHref: string;
  statusFilter: AdminRequestsStatusFilter;
  sort: AdminRequestsSort;
  dateRange?: AdminRequestsDateRange;
  customDateFrom?: string;
  customDateTo?: string;
  latestActivityByRequestId?: Record<string, AdminActivityLogEntry>;
  nextCursor?: string | null;
};

const statusClass: Record<OfficeRequest["status"], string> = {
  new: "bg-blue-50 text-blue-800 ring-blue-100",
  in_progress: "bg-amber-50 text-amber-800 ring-amber-100",
  contacted: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  completed: "bg-gov-accent-muted text-gov-navy ring-gov-accent-muted",
  cancelled: "bg-red-50 text-red-800 ring-red-100",
};

function StatusBadge({ status }: { status: OfficeRequest["status"] }) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-extrabold ring-1 ${statusClass[status]}`}
    >
      {REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

function BookingMeta({
  request,
  labelById,
}: {
  request: OfficeRequest;
  labelById: Record<string, string>;
}) {
  if (request.type !== "booking") return null;

  const tid = effectiveTravelerStateIdOnRequest(request);
  const label = tid ? labelById[tid] ?? tid : null;

  return (
    <span className="mt-1 block text-xs leading-relaxed text-gov-gray-600">
      {[label, request.preferredDate].filter(Boolean).join(" - ") || "-"}
    </span>
  );
}

function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ar-EG", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function emptyMessage(
  typeFilter: RequestTypeFilter,
  activeTravelerStateId: string | null,
  statusFilter: AdminRequestsStatusFilter,
  dateRange: AdminRequestsDateRange,
  hasCustomDateRange: boolean,
): string {
  const scope =
    dateRange === "all" && !hasCustomDateRange
      ? "ضمن الصفحة الحالية."
      : "ضمن حجوزات الفترة المختارة.";

  if (statusFilter !== "all") {
    return `لا توجد طلبات بحالة «${REQUEST_STATUS_LABELS[statusFilter]}» ${scope}`;
  }
  if (activeTravelerStateId !== null) {
    return "لا توجد حجوزات مطابقة لهذه الحالة ضمن القائمة.";
  }
  if (typeFilter === "booking") {
    return `لا توجد حجوزات ${scope}`;
  }
  if (typeFilter === "complaint") {
    return `لا توجد شكاوى أو مقترحات ${scope}`;
  }
  if (typeFilter === "all") {
    return `لا توجد طلبات ${scope}`;
  }
  return "لا توجد طلبات مطابقة للتصفية الحالية.";
}

export function AdminRequestsTable({
  requests,
  locale,
  travelerStates,
  requestsListHref,
  statusFilter,
  sort,
  dateRange = "all",
  customDateFrom,
  customDateTo,
  latestActivityByRequestId = {},
  nextCursor = null,
}: AdminRequestsTableProps) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<RequestTypeFilter>("all");
  const [activeTravelerStateId, setActiveTravelerStateId] = useState<
    string | null
  >(null);

  const filterStates = useMemo(
    () =>
      travelerStates.length > 0
        ? travelerStates
        : defaultTravelerStatesFromLegacyLabels(),
    [travelerStates],
  );

  const labelById = useMemo(
    () => mergeTravelerStateLabelsWithLegacy(travelerStates),
    [travelerStates],
  );

  const filteredRequests = useMemo(() => {
    let list = requests;
    if (typeFilter === "booking") {
      list = requests.filter((r) => r.type === "booking");
    } else if (typeFilter === "complaint") {
      list = requests.filter(
        (r) => r.type === "complaint" || r.type === "proposal",
      );
    }
    if (activeTravelerStateId !== null) {
      list = list.filter(
        (request) =>
          request.type !== "booking" ||
          effectiveTravelerStateIdOnRequest(request) === activeTravelerStateId,
      );
    }
    return list;
  }, [requests, typeFilter, activeTravelerStateId]);

  const typeCounts = useMemo(() => {
    let booking = 0;
    let complaint = 0;
    let proposal = 0;
    for (const r of requests) {
      if (r.status !== "new") continue;
      if (r.type === "booking") booking++;
      else if (r.type === "complaint") complaint++;
      else if (r.type === "proposal") proposal++;
    }
    return { booking, complaint, proposal };
  }, [requests]);

  const travelerStateBookingCounts = useMemo(() => {
    const ids = new Set(filterStates.map((s) => s.id));
    const counts: Record<string, number> = Object.fromEntries(
      filterStates.map((s) => [s.id, 0]),
    );
    for (const r of requests) {
      if (r.type !== "booking" || r.status !== "new") continue;
      const tid = effectiveTravelerStateIdOnRequest(r);
      if (tid && ids.has(tid)) counts[tid] = (counts[tid] ?? 0) + 1;
    }
    return counts;
  }, [requests, filterStates]);

  function typeCountForTab(tabId: RequestTypeFilter): number {
    if (tabId === "all") {
      return typeCounts.booking + typeCounts.complaint + typeCounts.proposal;
    }
    if (tabId === "booking") return typeCounts.booking;
    return typeCounts.complaint + typeCounts.proposal;
  }

  const hasCustomDateRange = Boolean(customDateFrom || customDateTo);
  const summaryLine = hasCustomDateRange
    ? `الطلبات المحمّلة، مع عرض الحجوزات بتاريخ من ${customDateFrom} إلى ${customDateTo} (توقيت القاهرة).`
    : dateRange === "all"
      ? "الحجوزات المعروضة هي الحجوزات القادمة فقط؛ الشكاوى والمقترحات كما هي."
      : "الحجوزات المعروضة حسب تاريخ الحجز المختار؛ الشكاوى والمقترحات كما هي.";

  const dateHrefParams = useMemo(
    (): Pick<AdminRequestsHrefParams, "from" | "to" | "range"> =>
      hasCustomDateRange
        ? { from: customDateFrom, to: customDateTo }
        : dateRange !== "all"
          ? { range: dateRange }
          : {},
    [customDateFrom, customDateTo, dateRange, hasCustomDateRange],
  );

  const listHref = useCallback(
    (overrides: AdminRequestsHrefParams = {}) => {
      const hasDateOverride =
        overrides.range !== undefined ||
        overrides.from !== undefined ||
        overrides.to !== undefined;
      const dateParams = hasDateOverride
        ? {
            ...(overrides.range ? { range: overrides.range } : {}),
            ...(overrides.from ? { from: overrides.from } : {}),
            ...(overrides.to ? { to: overrides.to } : {}),
          }
        : dateHrefParams;

      return buildAdminRequestsHref(requestsListHref, {
        status: overrides.status ?? statusFilter,
        sort: overrides.sort ?? sort,
        ...dateParams,
        ...(overrides.cursor ? { cursor: overrides.cursor } : {}),
      });
    },
    [dateHrefParams, requestsListHref, sort, statusFilter],
  );

  const nextHref = useMemo(
    () =>
      nextCursor
        ? listHref({ cursor: nextCursor })
        : null,
    [listHref, nextCursor],
  );

  return (
    <div className="rounded-lg border border-gov-gray-200 bg-white shadow-sm">
      <div className="border-b border-gov-gray-200 px-4 py-3">
        <h2 className="font-heading text-lg font-bold text-gov-navy">
          أحدث الطلبات
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-gov-gray-600">
          {summaryLine}
        </p>
        <details className="group mt-2 text-sm">
          <summary className="cursor-pointer list-none text-xs font-bold text-gov-navy marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="underline decoration-gov-gray-300 underline-offset-2 group-open:decoration-gov-navy">
              شرح القائمة والأعمدة
            </span>
          </summary>
          <div className="mt-2 space-y-1.5 border-s-2 border-gov-gray-200 ps-3 text-xs leading-relaxed text-gov-gray-600">
            <p>
              «الكل» يعرض كل الأنواع؛ «الحجوزات» يعرض طلبات التطعيم فقط؛
              «الشكاوى» يعرض الشكاوى والمقترحات معاً.
            </p>
            <p>
              عمود «الإجراء» يخص الشكاوى والمقترحات فقط؛ الحجوزات لا تحتاج
              إجراء أو تفاصيل متابعة من المكتب.
            </p>
          </div>
        </details>
      </div>

      <div className="border-b border-gov-gray-200 px-4 py-4">
        <div className="overflow-x-auto rounded-lg border border-gov-gray-200 bg-gov-gray-50/70 p-3 [-webkit-overflow-scrolling:touch] lg:overflow-visible">
          <div
            dir="rtl"
            className="flex w-full flex-col gap-4 text-right sm:gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:justify-start lg:gap-x-4 lg:gap-y-3"
          >
            <fieldset className="w-full min-w-0 shrink-0 space-y-1.5 lg:w-auto">
              <legend className="whitespace-nowrap text-xs font-extrabold text-gov-navy">
                نوع الطلب
              </legend>
              <div
                className={`${SEGMENT_TRAY} w-full`}
                role="tablist"
                aria-label="تصفية الطلبات حسب النوع"
              >
                {TYPE_TABS.map((tab) => {
                  const selected = typeFilter === tab.id;
                  const n = typeCountForTab(tab.id);
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-label={`${tab.label}، ${n} طلب جديد في القائمة المحمّلة`}
                      onClick={() => {
                        setTypeFilter(tab.id);
                        if (tab.id !== "booking") {
                          setActiveTravelerStateId(null);
                        }
                      }}
                      className={segmentClass(selected)}
                    >
                      <span className="flex flex-col items-center gap-0.5 sm:flex-row sm:items-center sm:gap-1.5">
                        <span>{tab.label}</span>
                        <span
                          className={typeTabCountClass(tab.id)}
                          aria-hidden
                        >
                          ({n})
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="w-full min-w-0 space-y-1.5 lg:w-auto">
              <legend className="whitespace-nowrap text-xs font-extrabold text-gov-navy">
                تاريخ الحجز (توقيت القاهرة)
              </legend>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:flex-nowrap lg:gap-2">
                <nav
                  className={`${SEGMENT_TRAY} w-full shrink-0 sm:w-auto`}
                  aria-label="فترة تاريخ الحجز"
                >
                  <Link
                    href={listHref()}
                    className={segmentClass(
                      dateRange === "all" && !hasCustomDateRange,
                    )}
                    aria-current={
                      dateRange === "all" && !hasCustomDateRange
                        ? "true"
                        : undefined
                    }
                  >
                    الكل
                  </Link>
                  <Link
                    href={listHref({ range: "today" })}
                    className={segmentClass(
                      dateRange === "today" && !hasCustomDateRange,
                    )}
                    aria-current={
                      dateRange === "today" && !hasCustomDateRange
                        ? "true"
                        : undefined
                    }
                  >
                    اليوم
                  </Link>
                  <Link
                    href={listHref({ range: "yesterday" })}
                    className={segmentClass(
                      dateRange === "yesterday" && !hasCustomDateRange,
                    )}
                    aria-current={
                      dateRange === "yesterday" && !hasCustomDateRange
                        ? "true"
                        : undefined
                    }
                  >
                    أمس
                  </Link>
                  <Link
                    href={listHref({ range: "today_yesterday" })}
                    className={segmentClass(
                      dateRange === "today_yesterday" && !hasCustomDateRange,
                    )}
                    aria-current={
                      dateRange === "today_yesterday" && !hasCustomDateRange
                        ? "true"
                        : undefined
                    }
                  >
                    اليوم + أمس
                  </Link>
                </nav>
                <form
                  action={listHref()}
                  className="grid w-full grid-cols-1 gap-2 min-[400px]:grid-cols-[1fr_1fr_auto_auto] sm:gap-1.5 lg:flex lg:w-auto lg:flex-nowrap lg:items-center"
                >
                  {statusFilter !== "all" ? (
                    <input type="hidden" name="status" value={statusFilter} />
                  ) : null}
                  {sort !== "created_desc" ? (
                    <input type="hidden" name="sort" value={sort} />
                  ) : null}
                  <label className="sr-only" htmlFor="requests-from-date">
                    من
                  </label>
                  <input
                    id="requests-from-date"
                    name="from"
                    type="date"
                    defaultValue={customDateFrom}
                    className={dateInputClass}
                    aria-label="من تاريخ"
                  />
                  <label className="sr-only" htmlFor="requests-to-date">
                    إلى
                  </label>
                  <input
                    id="requests-to-date"
                    name="to"
                    type="date"
                    defaultValue={customDateTo}
                    className={dateInputClass}
                    aria-label="إلى تاريخ"
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-9 items-center justify-center rounded-md bg-gov-navy px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-gov-navy/90"
                  >
                    تطبيق
                  </button>
                  {hasCustomDateRange ? (
                    <Link
                      href={listHref()}
                      className="inline-flex min-h-9 items-center justify-center rounded-md border border-gov-gray-200 bg-white px-3 py-1.5 text-xs font-extrabold text-gov-navy transition hover:bg-gov-gray-50"
                    >
                      مسح
                    </Link>
                  ) : null}
                </form>
              </div>
            </fieldset>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end lg:flex lg:w-auto lg:shrink-0 lg:gap-3">
              <fieldset className="min-w-0 space-y-1.5">
                <legend className="whitespace-nowrap text-xs font-extrabold text-gov-navy">
                  حالة الطلب
                </legend>
                <select
                  id="requests-status"
                  value={statusFilter}
                  className={filterSelectClass}
                  aria-label="تصفية حسب حالة الطلب"
                  onChange={(e) => {
                    router.push(
                      listHref({
                        status: e.target.value as AdminRequestsStatusFilter,
                      }),
                    );
                  }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </fieldset>

              <fieldset className="min-w-0 space-y-1.5">
                <legend className="whitespace-nowrap text-xs font-extrabold text-gov-navy">
                  الترتيب
                </legend>
                <select
                  id="requests-sort"
                  value={sort}
                  className={filterSelectClass}
                  aria-label="ترتيب الطلبات"
                  onChange={(e) => {
                    router.push(
                      listHref({
                        sort: e.target.value as AdminRequestsSort,
                      }),
                    );
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </fieldset>
            </div>

            {typeFilter === "booking" ? (
              <fieldset className="w-full min-w-0 basis-full space-y-1.5 lg:basis-full">
                <legend className="text-xs font-extrabold text-gov-navy">
                  حالة المسافر (اختياري)
                </legend>
                <div
                  className={SEGMENT_TRAY}
                  role="group"
                  aria-label="تصفية حجوزات المسافرين حسب الحالة"
                >
                  {filterStates.map((s) => {
                    const pressed = activeTravelerStateId === s.id;
                    const n = travelerStateBookingCounts[s.id] ?? 0;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={pressed}
                        aria-label={`${s.labelAr}، ${n} حجز جديد في القائمة المحمّلة`}
                        onClick={() =>
                          setActiveTravelerStateId((prev) =>
                            prev === s.id ? null : s.id,
                          )
                        }
                        className={segmentClass(pressed)}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{s.labelAr}</span>
                          <span
                            className="tabular-nums text-[11px] font-black text-gov-gray-600 sm:text-xs"
                            aria-hidden
                          >
                            ({n})
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}
          </div>
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
                  {emptyMessage(
                    typeFilter,
                    activeTravelerStateId,
                    statusFilter,
                    dateRange,
                    hasCustomDateRange,
                  )}
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => {
                const latest = latestActivityByRequestId[request.id];
                return (
                  <tr key={request.id} className="hover:bg-gov-gray-50/70">
                    <td className="px-4 py-3 font-bold text-gov-navy">
                      {request.name}
                    </td>
                    <td className="px-4 py-3">{request.phone}</td>
                    <td className="px-4 py-3">{request.officeNameAr}</td>
                    <td className="px-4 py-3">
                      {REQUEST_TYPE_LABELS[request.type]}
                      <BookingMeta request={request} labelById={labelById} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="max-w-[min(18rem,40vw)] px-4 py-3 align-top">
                      {request.type === "booking" ? (
                        <p className="text-xs font-semibold text-gov-gray-500">
                          الحجز ظاهر للمتابعة اليومية فقط؛ لا يوجد إجراء مطلوب.
                        </p>
                      ) : latest ? (
                        <div className="space-y-1.5">
                          <p className="text-xs leading-relaxed text-gov-gray-800">
                            {latest.summaryAr}
                          </p>
                          <p className="text-[11px] text-gov-gray-500">
                            {formatActivityTime(latest.createdAt)}
                          </p>
                          <Link
                            href={`/${locale}/admin/requests/${request.id}`}
                            className="inline-flex min-h-9 items-center rounded-md border border-gov-gray-200 px-3 text-xs font-extrabold text-gov-navy transition hover:border-gov-accent hover:text-gov-accent"
                          >
                            التفاصيل
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-xs text-gov-gray-500">
                            لا يوجد سجل نشاط بعد
                          </p>
                          <Link
                            href={`/${locale}/admin/requests/${request.id}`}
                            className="inline-flex min-h-9 items-center rounded-md border border-gov-gray-200 px-3 text-xs font-extrabold text-gov-navy transition hover:border-gov-accent hover:text-gov-accent"
                          >
                            التفاصيل
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {nextHref ? (
        <div className="border-t border-gov-gray-200 px-4 py-4 text-center">
          <Link
            href={nextHref}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-300 bg-white px-4 py-2 text-sm font-extrabold text-gov-navy transition hover:border-gov-accent hover:text-gov-accent"
          >
            تحميل المزيد
          </Link>
        </div>
      ) : null}
    </div>
  );
}
