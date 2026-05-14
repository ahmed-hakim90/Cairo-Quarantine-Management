"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookingPassQrImage } from "@/components/booking/BookingPassQrImage";
import { bookingPassFormCopy } from "@/lib/i18n/booking-pass-copy";
import type { Locale } from "@/lib/i18n/config";
import {
  defaultTravelerStatesFromLegacyLabels,
  effectiveTravelerStateIdOnRequest,
  mergeTravelerStateLabelsWithLegacy,
} from "@/lib/office-requests/office-traveler-state";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  TRAVELER_CATEGORY_LABELS,
  type PublicOfficeRequestStatus,
} from "@/lib/office-requests/types";

const TRAVELER_LABEL_BY_ID = mergeTravelerStateLabelsWithLegacy(
  defaultTravelerStatesFromLegacyLabels(),
);
const STORAGE_KEY = "cairo-office-requests:v1";
const POLL_INTERVAL_MS = 30_000;

type StoredRequest = PublicOfficeRequestStatus & {
  phone: string;
  missing?: boolean;
};

type MyRequestsPanelProps = {
  locale: Locale;
};

const copy = {
  ar: {
    title: "طلباتي",
    intro:
      "الطلبات المحفوظة على هذا الجهاز تظهر هنا ويتم تحديث حالتها تلقائياً.",
    empty: "لا توجد طلبات محفوظة على هذا الجهاز بعد.",
    refresh: "تحديث",
    refreshing: "جاري التحديث...",
    remove: "حذف من الجهاز",
    status: "الحالة",
    notes: "ملاحظات المتابعة",
    noNotes: "لا توجد ملاحظات متابعة حتى الآن.",
    office: "المكتب",
    travelerState: "حالة المسافر",
    preferredDate: "التاريخ المطلوب",
    createdAt: "تاريخ الإرسال",
    updatedAt: "آخر تحديث",
    missing: "لم يتم العثور على الطلب بهذا الرقم ورقم الهاتف.",
    loadError: "تعذر تحديث الطلبات حالياً.",
    qrSectionTitle: "رمز بطاقة الحجز",
  },
  en: {
    title: "My requests",
    intro:
      "Requests saved on this device appear here and refresh automatically.",
    empty: "No requests are saved on this device yet.",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    remove: "Remove from device",
    status: "Status",
    notes: "Follow-up notes",
    noNotes: "No follow-up notes yet.",
    office: "Office",
    travelerState: "Traveler status",
    preferredDate: "Preferred date",
    createdAt: "Submitted",
    updatedAt: "Last updated",
    missing: "No request was found for this number and phone.",
    loadError: "Requests could not be refreshed right now.",
    qrSectionTitle: "Booking pass QR",
  },
  zh: {
    title: "我的申请",
    intro: "保存在此设备上的申请会显示在这里，并自动刷新状态。",
    empty: "此设备尚未保存任何申请。",
    refresh: "刷新",
    refreshing: "正在刷新...",
    remove: "从设备删除",
    status: "状态",
    notes: "跟进备注",
    noNotes: "暂无跟进备注。",
    office: "办公室",
    travelerState: "旅客状态",
    preferredDate: "预约日期",
    createdAt: "提交时间",
    updatedAt: "最后更新",
    missing: "未找到与该编号和电话匹配的申请。",
    loadError: "目前无法刷新申请。",
    qrSectionTitle: "预约凭证二维码",
  },
} satisfies Record<Locale, Record<string, string>>;

function readStoredRequests(): StoredRequest[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoredRequest) : [];
  } catch {
    return [];
  }
}

function isStoredRequest(value: unknown): value is StoredRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Record<string, unknown>;
  return typeof request.id === "string" && typeof request.phone === "string";
}

function writeStoredRequests(requests: StoredRequest[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests.slice(0, 20)));
}

function mergeRequests(
  current: StoredRequest[],
  updates: PublicOfficeRequestStatus[],
  missing: string[],
): StoredRequest[] {
  const byId = new Map(updates.map((request) => [request.id, request]));
  const missingIds = new Set(missing);

  return current.map((request) => {
    const update = byId.get(request.id);
    if (update) return { ...request, ...update, missing: false };
    if (missingIds.has(request.id)) return { ...request, missing: true };
    return request;
  });
}

function formatDate(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function MyRequestsPanel({ locale }: MyRequestsPanelProps) {
  const t = copy[locale];
  const [requests, setRequests] = useState<StoredRequest[]>(() =>
    readStoredRequests(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshRequests = useCallback(async (items: StoredRequest[]) => {
    if (items.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/office-requests/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: items.map(({ id, phone }) => ({ id, phone })),
        }),
      });

      if (!response.ok) throw new Error("Request failed.");

      const data = (await response.json()) as {
        requests?: PublicOfficeRequestStatus[];
        missing?: string[];
      };
      const next = mergeRequests(
        items,
        data.requests ?? [],
        data.missing ?? [],
      );
      writeStoredRequests(next);
      setRequests(next);
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refreshRequests(readStoredRequests());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refreshRequests]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = readStoredRequests();
      void refreshRequests(current);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [refreshRequests]);

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [requests],
  );

  function removeRequest(id: string) {
    const next = requests.filter((request) => request.id !== id);
    writeStoredRequests(next);
    setRequests(next);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
      <section className="min-w-0">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-gov-navy">
              {t.title}
            </h1>
            <p className="mt-2 max-w-2xl leading-relaxed text-gov-gray-700">
              {t.intro}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshRequests(requests)}
            disabled={loading || requests.length === 0}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-gov-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-gov-navy disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t.refreshing : t.refresh}
          </button>
        </div>

        {error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {error}
          </p>
        ) : null}

        {sortedRequests.length === 0 ? (
          <div className="rounded-lg border border-gov-gray-200 bg-white p-6 text-gov-gray-700 shadow-sm">
            {t.empty}
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedRequests.map((request) => (
              <article
                key={request.id}
                className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-gov-accent">
                      {REQUEST_TYPE_LABELS[request.type]}
                    </p>
                    <h2 className="mt-1 font-heading text-xl font-extrabold text-gov-navy">
                      #{request.id}
                    </h2>
                    <p className="mt-2 text-sm text-gov-gray-600">
                      {t.office}: {request.officeNameAr || "-"}
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-md bg-gov-accent-muted px-3 py-2 text-sm font-bold text-gov-navy">
                    {request.missing
                      ? t.missing
                      : REQUEST_STATUS_LABELS[request.status]}
                  </span>
                </div>

                <dl className="mt-5 grid gap-4 border-t border-gov-gray-200 pt-4 text-sm md:grid-cols-3">
                  {request.type === "booking" ? (
                    <>
                      <div>
                        <dt className="font-bold text-gov-navy">
                          {t.travelerState}
                        </dt>
                        <dd className="mt-1 text-gov-gray-700">
                          {(() => {
                            const id =
                              effectiveTravelerStateIdOnRequest(request);
                            if (!id) return "-";
                            return (
                              TRAVELER_LABEL_BY_ID[id] ??
                              (request.travelerCategory
                                ? TRAVELER_CATEGORY_LABELS[
                                    request.travelerCategory
                                  ]
                                : id)
                            );
                          })()}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-bold text-gov-navy">
                          {t.preferredDate}
                        </dt>
                        <dd className="mt-1 text-gov-gray-700">
                          {request.preferredDate || "-"}
                        </dd>
                      </div>
                    </>
                  ) : null}
                  <div>
                    <dt className="font-bold text-gov-navy">{t.status}</dt>
                    <dd className="mt-1 text-gov-gray-700">
                      {REQUEST_STATUS_LABELS[request.status]}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-gov-navy">{t.createdAt}</dt>
                    <dd className="mt-1 text-gov-gray-700">
                      {formatDate(request.createdAt, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-gov-navy">{t.updatedAt}</dt>
                    <dd className="mt-1 text-gov-gray-700">
                      {formatDate(request.updatedAt, locale)}
                    </dd>
                  </div>
                </dl>

                {request.type === "booking" && request.passToken ? (
                  <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50/50 p-4">
                    <h3 className="text-sm font-bold text-gov-navy">
                      {t.qrSectionTitle}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-gov-gray-600">
                      {bookingPassFormCopy[locale].cardSubtitle}
                    </p>
                    <div className="mt-4 flex justify-center sm:justify-start">
                      <BookingPassQrImage
                        locale={locale}
                        requestId={request.id}
                        passToken={request.passToken}
                        alt={bookingPassFormCopy[locale].qrAlt}
                        displayWidth={200}
                        imgClassName="rounded-lg border border-emerald-200/80 bg-white p-2 shadow-sm"
                      />
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 rounded-md bg-gov-gray-50 p-4">
                  <h3 className="text-sm font-bold text-gov-navy">
                    {t.notes}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gov-gray-700">
                    {request.notes || t.noNotes}
                  </p>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeRequest(request.id)}
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-200 px-4 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50"
                  >
                    {t.remove}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
