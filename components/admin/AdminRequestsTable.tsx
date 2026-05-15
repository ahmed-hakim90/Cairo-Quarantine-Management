"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  defaultTravelerStatesFromLegacyLabels,
  effectiveTravelerStateIdOnRequest,
  mergeTravelerStateLabelsWithLegacy,
} from "@/lib/office-requests/office-traveler-state";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  type AdminActivityLogEntry,
  type OfficeRequest,
  type TravelerState,
} from "@/lib/office-requests/types";

export type AdminRequestsDateRange =
  | "all"
  | "today"
  | "yesterday"
  | "today_yesterday";

type RequestTypeFilter = "all" | "complaint" | "proposal";

const TYPE_TABS: { id: RequestTypeFilter; label: string }[] = [
  { id: "all", label: "الحجوزات" },
  { id: "complaint", label: "شكاوى فقط" },
  { id: "proposal", label: "مقترحات فقط" },
];

const SEGMENT_TRAY =
  "flex w-full min-w-0 flex-wrap gap-1 rounded-md bg-gov-gray-100 p-1 sm:flex-nowrap";

const segmentClass = (active: boolean) =>
  [
    "inline-flex min-h-11 flex-1 basis-[calc(50%-0.125rem)] items-center justify-center rounded-md px-2 py-2 text-center text-xs font-extrabold transition sm:min-w-0 sm:basis-0",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-gov-gray-100",
    active
      ? "bg-white text-gov-navy shadow-sm"
      : "text-gov-gray-600 hover:text-gov-navy",
  ].join(" ");

function typeTabCountClass(tabId: RequestTypeFilter): string {
  if (tabId === "all") {
    return "tabular-nums font-black text-red-600";
  }
  if (tabId === "complaint") {
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
  /** افتراضي: الكل (آخر 200 حسب تاريخ الإنشاء). */
  dateRange?: AdminRequestsDateRange;
  latestActivityByRequestId?: Record<string, AdminActivityLogEntry>;
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
  dateRange: AdminRequestsDateRange,
): string {
  const scope =
    dateRange === "all"
      ? "ضمن آخر 200 طلباً محمّلة."
      : "ضمن الطلبات المحدّثة في الفترة المختارة (حتى 200 طلباً).";

  if (typeFilter === "complaint") {
    return `لا توجد شكاوى ${scope}`;
  }
  if (typeFilter === "proposal") {
    return `لا توجد مقترحات ${scope}`;
  }
  if (typeFilter === "all" && activeTravelerStateId === null) {
    return `لا توجد حجوزات ${scope}`;
  }
  if (activeTravelerStateId !== null) {
    return "لا توجد حجوزات مطابقة لهذه الحالة ضمن القائمة.";
  }
  return "لا توجد طلبات مطابقة للتصفية الحالية.";
}

export function AdminRequestsTable({
  requests,
  locale,
  travelerStates,
  requestsListHref,
  dateRange = "all",
  latestActivityByRequestId = {},
}: AdminRequestsTableProps) {
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
    let list =
      typeFilter === "all"
        ? requests.filter((r) => r.type === "booking")
        : requests.filter((r) => r.type === typeFilter);
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
      if (r.type !== "booking") continue;
      const tid = effectiveTravelerStateIdOnRequest(r);
      if (tid && ids.has(tid)) counts[tid] = (counts[tid] ?? 0) + 1;
    }
    return counts;
  }, [requests, filterStates]);

  function typeCountForTab(tabId: RequestTypeFilter): number {
    if (tabId === "all") return typeCounts.booking;
    if (tabId === "complaint") return typeCounts.complaint;
    return typeCounts.proposal;
  }

  const summaryLine =
    dateRange === "all"
      ? "آخر 200 طلباً حسب صلاحيتك؛ الترتيب حسب تاريخ الإنشاء. اختر فترة لتصفية بآخر تحديث (توقيت القاهرة)."
      : "حتى 200 طلباً حُدِّثت في الفترة المختارة (توقيت القاهرة)؛ الترتيب حسب آخر تحديث.";

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
              تبويب «الحجوزات» يقتصر على طلبات التطعيم ضمن القائمة المحمّلة؛
              الشكاوى والمقترحات من التبويبين المخصصين.
            </p>
            <p>
              عمود «الإجراء» يعرض أحدث سجل نشاط مرتبط بالطلب عند توفره، مع
              وقت قصير وربط للتفاصيل.
            </p>
          </div>
        </details>
      </div>

      <div className="border-b border-gov-gray-200 px-4 py-4">
        <div className="rounded-lg border border-gov-gray-200 bg-gov-gray-50/70 p-3 sm:p-4">
          <h3 className="mb-3 font-heading text-sm font-extrabold text-gov-navy">
            تصفية القائمة
          </h3>
          <div className="space-y-4">
            <fieldset className="min-w-0 space-y-2">
              <legend className="text-sm font-bold text-gov-navy">
                آخر تحديث للطلب (توقيت القاهرة)
              </legend>
              <p className="text-xs leading-relaxed text-gov-gray-600">
                اختيار فترة يعيد تحميل الطلبات من الخادم؛ الأعداد في التبويبات
                أدناه تعكس القائمة بعد التحميل.
              </p>
              <nav className={SEGMENT_TRAY} aria-label="فترة آخر تحديث">
                <Link
                  href={requestsListHref}
                  className={segmentClass(dateRange === "all")}
                  aria-current={dateRange === "all" ? "true" : undefined}
                >
                  الكل
                </Link>
                <Link
                  href={`${requestsListHref}?range=today`}
                  className={segmentClass(dateRange === "today")}
                  aria-current={dateRange === "today" ? "true" : undefined}
                >
                  اليوم
                </Link>
                <Link
                  href={`${requestsListHref}?range=yesterday`}
                  className={segmentClass(dateRange === "yesterday")}
                  aria-current={dateRange === "yesterday" ? "true" : undefined}
                >
                  أمس
                </Link>
                <Link
                  href={`${requestsListHref}?range=today_yesterday`}
                  className={segmentClass(dateRange === "today_yesterday")}
                  aria-current={
                    dateRange === "today_yesterday" ? "true" : undefined
                  }
                >
                  اليوم + أمس
                </Link>
              </nav>
            </fieldset>

            <fieldset className="min-w-0 space-y-2">
              <legend className="text-sm font-bold text-gov-navy">
                نوع الطلب
              </legend>
              <p className="text-xs leading-relaxed text-gov-gray-600">
                الأعداد ضمن الطلبات المعروضة في القائمة المحمّلة حالياً فقط.
              </p>
              <div
                className={SEGMENT_TRAY}
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
                      aria-label={`${tab.label}، ${n} في القائمة المحمّلة`}
                      onClick={() => {
                        setTypeFilter(tab.id);
                        if (tab.id !== "all") {
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

            {typeFilter === "all" ? (
              <fieldset className="min-w-0 space-y-2">
                <legend className="text-sm font-bold text-gov-navy">
                  حالة المسافر (اختياري)
                </legend>
                <p className="text-xs leading-relaxed text-gov-gray-600">
                  يصفّي الحجوزات المعروضة فقط؛ الرقم بجانب كل حالة = عدد الحجوزات
                  من ذلك النوع في القائمة الحالية.
                </p>
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
                        aria-label={`${s.labelAr}، ${n} حجزاً في القائمة المحمّلة`}
                        onClick={() =>
                          setActiveTravelerStateId((prev) =>
                            prev === s.id ? null : s.id,
                          )
                        }
                        className={segmentClass(pressed)}
                      >
                        <span className="flex flex-col items-center gap-0.5 sm:flex-row sm:items-center sm:gap-1.5">
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
                  {emptyMessage(typeFilter, activeTravelerStateId, dateRange)}
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
                      {latest ? (
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
    </div>
  );
}
