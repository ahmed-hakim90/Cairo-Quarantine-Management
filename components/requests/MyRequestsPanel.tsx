"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RequestPassCardActions } from "@/components/booking/RequestPassCardActions";
import { bookingRequestCopy } from "@/lib/i18n/booking-request-copy";
import { bookingPassFormCopy } from "@/lib/i18n/booking-pass-copy";
import type { Locale } from "@/lib/i18n/config";
import {
  publicRequestStatusLabels,
  publicRequestTypeLabels,
  publicTravelerCategoryLabels,
} from "@/lib/i18n/office-request-copy";
import {
  defaultTravelerStatesFromLegacyLabels,
  effectiveTravelerStateIdOnRequest,
  mergeTravelerStateLabelsWithLegacy,
} from "@/lib/office-requests/office-traveler-state";
import {
  readStoredRequests,
  removeStoredRequest,
  writeStoredRequests,
  type StoredOfficeRequest,
} from "@/lib/office-requests/my-requests-storage";
import {
  type PublicOfficeRequestStatus,
} from "@/lib/office-requests/types";
import { MyRequestsSkeleton } from "@/components/skeletons/public/MyRequestsSkeleton";
import { feedbackToast } from "@/lib/ui/feedback-toast";

const TRAVELER_LABEL_BY_ID = mergeTravelerStateLabelsWithLegacy(
  defaultTravelerStatesFromLegacyLabels(),
);

type MyRequestsPanelProps = {
  locale: Locale;
  serverSiteOrigin?: string;
};

const copy = {
  ar: {
    title: "طلباتي",
    intro:
      "الطلبات المحفوظة على هذا الجهاز تظهر هنا. اضغط «تحديث» لمزامنة أحدث الحالة من الخادم.",
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
    passSectionTitle: "بطاقة المتابعة",
    cancel: "إلغاء الطلب",
    cancelling: "جاري الإلغاء...",
    cancelConfirm: "هل تريد إلغاء هذا الطلب؟",
    cancelOk: "تم إلغاء الطلب.",
    cancelFail: "تعذر إلغاء الطلب.",
    statusChanged: "تم تحديث حالة أحد طلباتك.",
  },
  en: {
    title: "My requests",
    intro:
      "Requests saved on this device appear here. Press Refresh to sync the latest status from the server.",
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
    passSectionTitle: "Follow-up card",
    cancel: "Cancel request",
    cancelling: "Cancelling...",
    cancelConfirm: "Cancel this request?",
    cancelOk: "Request cancelled.",
    cancelFail: "Could not cancel the request.",
    statusChanged: "A request status was updated.",
  },
  zh: {
    title: "我的申请",
    intro:
      "保存在此设备上的申请会显示在这里。点击「刷新」可从服务器同步最新状态。",
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
    passSectionTitle: "跟进卡",
    cancel: "取消申请",
    cancelling: "正在取消...",
    cancelConfirm: "确定要取消此申请吗？",
    cancelOk: "已取消申请。",
    cancelFail: "无法取消申请。",
    statusChanged: "某条申请的状态已更新。",
  },
  fr: {
    title: "Mes demandes",
    intro:
      "Les demandes enregistrees sur cet appareil apparaissent ici. Appuyez sur Actualiser pour synchroniser le dernier statut depuis le serveur.",
    empty: "Aucune demande n'est encore enregistree sur cet appareil.",
    refresh: "Actualiser",
    refreshing: "Actualisation...",
    remove: "Supprimer de l'appareil",
    status: "Statut",
    notes: "Notes de suivi",
    noNotes: "Aucune note de suivi pour le moment.",
    office: "Bureau",
    travelerState: "Statut du voyageur",
    preferredDate: "Date souhaitee",
    createdAt: "Envoyee",
    updatedAt: "Derniere mise a jour",
    missing: "Aucune demande n'a ete trouvee pour ce numero et ce telephone.",
    loadError: "Les demandes ne peuvent pas etre actualisees maintenant.",
    passSectionTitle: "Carte de suivi",
    cancel: "Annuler la demande",
    cancelling: "Annulation...",
    cancelConfirm: "Annuler cette demande ?",
    cancelOk: "Demande annulee.",
    cancelFail: "Impossible d'annuler la demande.",
    statusChanged: "Le statut d'une demande a ete mis a jour.",
  },
} satisfies Record<Locale, Record<string, string>>;

const CANCELLABLE: PublicOfficeRequestStatus["status"][] = [
  "new",
  "in_progress",
  "contacted",
];

function mergeRequests(
  current: StoredOfficeRequest[],
  updates: PublicOfficeRequestStatus[],
  missing: string[],
): StoredOfficeRequest[] {
  const byId = new Map(updates.map((request) => [request.id, request]));
  const missingIds = new Set(missing);

  return current.map((request) => {
    const update = byId.get(request.id);
    if (update) {
      return {
        ...request,
        ...update,
        passToken: request.passToken,
        missing: false,
      };
    }
    if (missingIds.has(request.id)) return { ...request, missing: true };
    return request;
  });
}

function formatDate(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const intlLocale =
    locale === "ar"
      ? "ar-EG"
      : locale === "zh"
        ? "zh-CN"
        : locale === "fr"
          ? "fr-FR"
          : "en";
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function MyRequestsPanel({
  locale,
  serverSiteOrigin = "",
}: MyRequestsPanelProps) {
  const t = copy[locale];
  const [requests, setRequests] = useState<StoredOfficeRequest[]>(() =>
    readStoredRequests(),
  );
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const statusByIdRef = useRef<Map<string, PublicOfficeRequestStatus["status"]>>(
    new Map(),
  );

  const refreshRequests = useCallback(async (items: StoredOfficeRequest[], silent = false) => {
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

      let statusChanged = false;
      for (const item of next) {
        if (item.missing) continue;
        const prev = statusByIdRef.current.get(item.id);
        if (prev && prev !== item.status) statusChanged = true;
        statusByIdRef.current.set(item.id, item.status);
      }

      if (!silent) {
        feedbackToast.success(bookingRequestCopy[locale].statusesUpdated);
      } else if (statusChanged) {
        feedbackToast.success(t.statusChanged);
      }
    } catch {
      setError(t.loadError);
      feedbackToast.error(t.loadError);
    } finally {
      setLoading(false);
    }
  }, [locale, t.loadError, t.statusChanged]);

  useEffect(() => {
    const stored = readStoredRequests();
    if (stored.length === 0) return;
    void refreshRequests(stored, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial sync only
  }, []);

  useEffect(() => {
    if (requests.length === 0) return;
    for (const r of requests) {
      if (!r.missing) statusByIdRef.current.set(r.id, r.status);
    }
    const tick = () => {
      if (document.visibilityState === "visible") {
        void refreshRequests(requests, true);
      }
    };
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [requests, refreshRequests]);

  function removeRequest(id: string) {
    removeStoredRequest(id);
    setRequests((current) => current.filter((request) => request.id !== id));
  }

  async function cancelRequest(request: StoredOfficeRequest) {
    if (!window.confirm(t.cancelConfirm)) return;
    setCancellingId(request.id);
    setError("");
    try {
      const response = await fetch("/api/office-requests/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, phone: request.phone }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "failed");
      feedbackToast.success(t.cancelOk);
      await refreshRequests(requests);
    } catch {
      setError(t.cancelFail);
      feedbackToast.error(t.cancelFail);
    } finally {
      setCancellingId(null);
    }
  }

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [requests],
  );

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 pb-8 sm:px-4 sm:py-8 lg:py-12">
      <section className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-gov-navy sm:text-3xl">
              {t.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gov-gray-700 sm:text-base">
              {t.intro}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshRequests(requests)}
            disabled={loading || requests.length === 0}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-md bg-gov-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-gov-navy disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? t.refreshing : t.refresh}
          </button>
        </div>

        {error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {error}
          </p>
        ) : null}

        {sortedRequests.length === 0 && loading ? (
          <MyRequestsSkeleton cardCount={1} compact />
        ) : sortedRequests.length === 0 ? (
          <div className="rounded-lg border border-gov-gray-200 bg-white p-6 text-gov-gray-700 shadow-sm">
            {t.empty}
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedRequests.map((request) => {
              const travelerLabel = (() => {
                const id = effectiveTravelerStateIdOnRequest(request);
                if (!id) return "-";
                if (id in publicTravelerCategoryLabels[locale]) {
                  return publicTravelerCategoryLabels[locale][
                    id as keyof (typeof publicTravelerCategoryLabels)[typeof locale]
                  ];
                }
                return (
                  TRAVELER_LABEL_BY_ID[id] ??
                  (request.travelerCategory
                    ? publicTravelerCategoryLabels[locale][request.travelerCategory]
                    : id)
                );
              })();

              return (
              <article
                key={request.id}
                className={`rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm sm:p-5 ${loading ? "opacity-70" : ""}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gov-accent">
                      {publicRequestTypeLabels[locale][request.type]}
                    </p>
                    <h2 className="mt-1 break-all font-heading text-lg font-extrabold text-gov-navy sm:text-xl">
                      #{request.id}
                    </h2>
                    <p className="mt-1 text-sm text-gov-gray-600">
                      {t.office}: {request.officeNameAr || "-"}
                    </p>
                  </div>
                  <span className="inline-flex w-fit shrink-0 rounded-md bg-gov-accent-muted px-3 py-1.5 text-xs font-bold text-gov-navy sm:py-2 sm:text-sm">
                    {request.missing
                      ? t.missing
                      : publicRequestStatusLabels[locale][request.status]}
                  </span>
                </div>

                {request.passToken ? (
                  <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50/60 p-3 sm:p-4">
                    <h3 className="text-sm font-bold text-gov-navy">
                      {t.passSectionTitle}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-gov-gray-600">
                      {request.type === "booking"
                        ? bookingPassFormCopy[locale].cardSubtitle
                        : bookingPassFormCopy[locale].cardSubtitleComplaint}
                    </p>
                    <div className="mt-3">
                      <RequestPassCardActions
                        locale={locale}
                        request={
                          request as PublicOfficeRequestStatus & {
                            passToken: string;
                          }
                        }
                        serverSiteOrigin={serverSiteOrigin}
                        buttonLayout="stack"
                        hideNotice
                      />
                    </div>
                  </div>
                ) : null}

                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-gov-gray-200 pt-4 text-sm sm:grid-cols-3 sm:gap-4">
                  {request.type === "booking" ? (
                    <>
                      <div>
                        <dt className="text-xs font-bold text-gov-navy sm:text-sm">
                          {t.travelerState}
                        </dt>
                        <dd className="mt-0.5 text-gov-gray-700">
                          {travelerLabel}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold text-gov-navy sm:text-sm">
                          {t.preferredDate}
                        </dt>
                        <dd className="mt-0.5 text-gov-gray-700">
                          {request.preferredDate || "-"}
                        </dd>
                      </div>
                    </>
                  ) : null}
                  <div>
                    <dt className="text-xs font-bold text-gov-navy sm:text-sm">
                      {t.createdAt}
                    </dt>
                    <dd className="mt-0.5 text-gov-gray-700">
                      {formatDate(request.createdAt, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-gov-navy sm:text-sm">
                      {t.updatedAt}
                    </dt>
                    <dd className="mt-0.5 text-gov-gray-700">
                      {formatDate(request.updatedAt, locale)}
                    </dd>
                  </div>
                </dl>

                <details className="mt-4 rounded-md bg-gov-gray-50 open:pb-1">
                  <summary className="cursor-pointer px-3 py-2.5 text-sm font-bold text-gov-navy sm:px-4">
                    {t.notes}
                  </summary>
                  <p className="whitespace-pre-wrap px-3 pb-3 text-sm leading-relaxed text-gov-gray-700 sm:px-4">
                    {request.notes || t.noNotes}
                  </p>
                </details>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                  <button
                    type="button"
                    onClick={() => removeRequest(request.id)}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-gov-gray-200 px-4 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50 sm:min-h-10 sm:w-auto"
                  >
                    {t.remove}
                  </button>
                  {!request.missing &&
                  CANCELLABLE.includes(request.status) ? (
                    <button
                      type="button"
                      disabled={cancellingId === request.id}
                      onClick={() => void cancelRequest(request)}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-800 transition hover:bg-red-100 disabled:opacity-60 sm:min-h-10 sm:w-auto"
                    >
                      {cancellingId === request.id ? t.cancelling : t.cancel}
                    </button>
                  ) : null}
                </div>
              </article>
            );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
