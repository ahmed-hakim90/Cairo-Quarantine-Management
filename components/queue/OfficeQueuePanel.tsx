"use client";

import { useActionState } from "react";
import {
  completeTicketAction,
  searchTicketAction,
  type QueuePanelState,
} from "@/app/[locale]/office-dashboard/[officeId]/queue/actions";
import type { DailyStats } from "@/lib/queue/types";
import type { QueueTicketWithRequest } from "@/lib/queue/types";

const initial: QueuePanelState = { ok: false };

type OfficeQueuePanelProps = {
  locale: string;
  officeId: string;
  officeNameAr: string;
  queueDate: string;
  stats: DailyStats;
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
}: OfficeQueuePanelProps) {
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

  const error =
    (!completeState.ok ? completeState.error : undefined) ??
    (!searchState.ok ? searchState.error : undefined) ??
    null;

  const pending = searchPending || completePending;
  const noShow = Math.max(0, stats.totalCheckedIn - stats.totalCompleted);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
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

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900"
        >
          {error}
        </p>
      ) : null}

      <form
        action={searchAction}
        className="space-y-4 rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm"
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="officeId" value={officeId} />
        <input type="hidden" name="queueDate" value={queueDate} />
        <div>
          <label htmlFor="search" className="block text-sm font-bold text-gov-navy">
            بحث برقم الدور أو رقم الطلب
          </label>
          <input
            id="search"
            name="search"
            required
            className="mt-2 w-full rounded-md border border-gov-gray-200 px-3 py-2.5 text-sm"
            placeholder="مثال: 12 أو CQM-000123"
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

      {ticket ? (
        <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
          <dl className="grid gap-3 text-sm">
            {ticket.request?.name ? (
              <Row label="الاسم" value={ticket.request.name} />
            ) : null}
            <Row label="رقم الطلب" value={ticket.requestNumber} />
            <Row label="رقم الدور" value={String(ticket.queueNumber)} />
            <Row label="الحالة" value={STATUS_LABELS[ticket.status]} />
          </dl>

          {ticket.status === "waiting" ? (
            <form action={completeAction} className="mt-5">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="ticketId" value={ticket.id} />
              <input type="hidden" name="officeId" value={officeId} />
              <button
                type="submit"
                disabled={completePending}
                className="w-full rounded-md bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {completePending ? "جاري التحديث…" : "تم الانتهاء"}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gov-gray-100 pb-2">
      <dt className="text-gov-gray-600">{label}</dt>
      <dd className="font-bold text-gov-navy">{value}</dd>
    </div>
  );
}
