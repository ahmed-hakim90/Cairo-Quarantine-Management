"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import {
  completeTicketAction,
  searchTicketAction,
  type QueuePanelState,
} from "@/app/[locale]/office-dashboard/[officeId]/queue/actions";
import { OfficeQueueTicketsSkeleton } from "@/components/skeletons/OfficeQueueTicketsSkeleton";
import { SkeletonCard } from "@/components/skeletons/primitives";
import { QueueCompleteTicketForm } from "@/components/queue/QueueCompleteTicketForm";
import { QueueTicketSearchResult } from "@/components/queue/QueueTicketSearchResult";
import type { DailyStats, QueueTicketWithRequest } from "@/lib/queue/types";
import { feedbackToast } from "@/lib/ui/feedback-toast";

const initial: QueuePanelState = { ok: false };

type OfficeQueuePanelProps = {
  locale: string;
  officeId: string;
  officeNameAr: string;
  queueDate: string;
  stats: DailyStats;
  tickets: QueueTicketWithRequest[];
};

const STATUS_LABELS = {
  waiting: "في الانتظار",
  completed: "تم الانتهاء",
} as const;

export function OfficeQueuePanel({
  locale,
  officeId,
  officeNameAr,
  queueDate,
  stats,
  tickets,
}: OfficeQueuePanelProps) {
  const router = useRouter();
  const [searchState, searchAction, searchPending] = useActionState(
    searchTicketAction,
    initial,
  );
  const [completeState, completeAction, completePending] = useActionState(
    completeTicketAction,
    initial,
  );

  const ticket: QueueTicketWithRequest | null =
    completeState.ok && completeState.ticket
      ? completeState.ticket
      : searchState.ok && searchState.ticket
        ? searchState.ticket
        : null;

  const wasSearchPending = useRef(false);
  const wasCompletePending = useRef(false);

  useEffect(() => {
    if (wasSearchPending.current && !searchPending) {
      if (!searchState.ok) {
        const message = searchState.error?.trim();
        if (message) feedbackToast.error(message);
      }
    }
    wasSearchPending.current = searchPending;
  }, [searchPending, searchState]);

  useEffect(() => {
    if (wasCompletePending.current && !completePending) {
      if (!completeState.ok) {
        const message = completeState.error?.trim();
        if (message) feedbackToast.error(message);
      } else {
        feedbackToast.success("تم تحديث حالة الدور.");
        router.refresh();
      }
    }
    wasCompletePending.current = completePending;
  }, [completePending, completeState, router]);

  const pending = searchPending || completePending;
  const noShow = Math.max(0, stats.totalCheckedIn - stats.totalCompleted);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-xs font-bold uppercase text-gov-gray-600">
          طابور اليوم
        </p>
        <h1 className="mt-1 font-heading text-2xl font-extrabold text-gov-navy">
          {officeNameAr}
        </h1>
        <p className="mt-1 text-sm text-gov-gray-600">{queueDate}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="حضر اليوم" value={stats.totalCheckedIn} />
        <StatCard label="تم الانتهاء" value={stats.totalCompleted} />
        <StatCard label="لم يكتمل" value={noShow} />
        <StatCard label="آخر رقم دور" value={stats.lastQueueNumber} />
      </div>

      <form
        action={searchAction}
        className="space-y-4 rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm"
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="officeId" value={officeId} />
        <input type="hidden" name="queueDate" value={queueDate} />
        <div>
          <label htmlFor="search" className="block text-sm font-bold text-gov-navy">
            بحث برقم الدور أو رقم الطلب أو الهاتف
          </label>
          <input
            id="search"
            name="search"
            required
            className="mt-2 w-full rounded-md border border-gov-gray-200 px-3 py-2.5 text-sm"
            placeholder="مثال: 12 أو cairo-trav-17-000001 أو 01552900017"
            dir="rtl"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-gov-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-gov-navy disabled:opacity-60"
        >
          {searchPending ? "جاري البحث…" : "بحث"}
        </button>
      </form>

      {searchPending ? (
        <SkeletonCard className="p-5">
          <OfficeQueueTicketsSkeleton rows={2} />
        </SkeletonCard>
      ) : ticket ? (
        <QueueTicketSearchResult
          locale={locale}
          officeId={officeId}
          ticket={ticket}
          completeAction={completeAction}
          completePending={completePending}
        />
      ) : null}

      <section className="rounded-lg border border-gov-gray-200 bg-white shadow-sm">
        <div className="border-b border-gov-gray-100 px-5 py-4">
          <h2 className="font-heading text-lg font-extrabold text-gov-navy">
            قائمة الحضور اليوم
          </h2>
          <p className="mt-1 text-sm text-gov-gray-600">
            {tickets.length > 0
              ? `${tickets.length} دور في الطابور`
              : stats.totalCheckedIn > 0 && stats.closed
                ? "تم إغلاق الطابور — التفاصيل محذوفة بعد الإغلاق"
                : "لا يوجد حضور مسجّل بعد"}
          </p>
        </div>

        {searchPending || completePending ? (
          <OfficeQueueTicketsSkeleton rows={5} />
        ) : tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-start text-sm">
              <caption className="sr-only">قائمة أدوار الطابور لهذا اليوم</caption>
              <thead className="bg-gov-navy text-white">
                <tr>
                  <th scope="col" className="px-4 py-3 font-heading font-semibold">
                    رقم الدور
                  </th>
                  <th scope="col" className="px-4 py-3 font-heading font-semibold">
                    الاسم
                  </th>
                  <th scope="col" className="px-4 py-3 font-heading font-semibold">
                    رقم الطلب
                  </th>
                  <th scope="col" className="px-4 py-3 font-heading font-semibold">
                    الهاتف
                  </th>
                  <th scope="col" className="px-4 py-3 font-heading font-semibold">
                    الحالة
                  </th>
                  <th scope="col" className="px-4 py-3 font-heading font-semibold">
                    إجراء
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-gov-gray-100 odd:bg-gov-gray-50/50"
                  >
                    <td className="px-4 py-3 font-extrabold text-gov-navy">
                      {row.queueNumber}
                    </td>
                    <td className="px-4 py-3 text-gov-gray-800">
                      {row.request?.name?.trim() || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gov-gray-800">
                      {row.requestNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gov-gray-800" dir="ltr">
                      {row.request?.phone?.trim() || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          row.status === "completed"
                            ? "rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800"
                            : "rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900"
                        }
                      >
                        {STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.status === "waiting" ? (
                        <QueueCompleteTicketForm
                          locale={locale}
                          officeId={officeId}
                          ticketId={row.id}
                          completeAction={completeAction}
                          disabled={completePending}
                          compact
                        />
                      ) : (
                        <span className="text-xs text-gov-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-gov-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-gov-navy">{value}</p>
    </div>
  );
}
