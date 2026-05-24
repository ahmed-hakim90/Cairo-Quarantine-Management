"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  checkinLookupAction,
  checkinRestoreAction,
  type CheckinState,
} from "@/app/[locale]/(public)/checkin/actions";
import { BookingDateCalendarReminder } from "@/components/queue/BookingDateCalendarReminder";
import { QueueCompletedCitizenView } from "@/components/queue/QueueCompletedCitizenView";
import { QueueWaitLive } from "@/components/queue/QueueWaitLive";
import { CheckinSkeleton } from "@/components/skeletons/public/CheckinSkeleton";
import { getCairoTodayYmd } from "@/lib/cairo-today-ymd";
import { checkinBookingCopy } from "@/lib/i18n/checkin-copy";
import type { Locale } from "@/lib/i18n/config";
import { bookingDateStatus } from "@/lib/queue/checkin-booking-day";
import {
  clearCheckinSession,
  loadCheckinSession,
  saveCheckinSession,
} from "@/lib/queue/checkin-session-storage";
import type { QueueBookingPreview } from "@/lib/queue/queue-booking-preview";

const initial: CheckinState = { ok: false };

type BookingQueueConfirmPanelProps = {
  locale: Locale;
  officeId: string;
  officeNameAr: string;
  preview: QueueBookingPreview;
  iosHelp: string;
};

function formatCopy(template: string, date: string): string {
  return template.replace("{date}", date);
}

export function BookingQueueConfirmPanel({
  locale,
  officeId,
  officeNameAr,
  preview,
  iosHelp,
}: BookingQueueConfirmPanelProps) {
  const t = checkinBookingCopy[locale];
  const today = getCairoTodayYmd();
  const dateStatus = bookingDateStatus(preview.preferredDate, today);

  const [lookupState, lookupAction, lookupPending] = useActionState(
    checkinLookupAction,
    initial,
  );
  const [restoredState, setRestoredState] = useState<CheckinState | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const session = loadCheckinSession(officeId);

    if (!session?.ticketId) {
      return;
    }

    const restoreTimer = window.setTimeout(() => setRestoring(true), 0);

    void checkinRestoreAction(officeId, session.ticketId, locale).then((state) => {
      if (cancelled) return;
      if (state.ok) {
        setRestoredState({
          ...state,
          lookup: preview.id,
        });
      } else {
        clearCheckinSession(officeId);
      }
      setRestoring(false);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(restoreTimer);
    };
  }, [officeId, locale, preview.id]);

  const result = lookupState.ok
    ? lookupState
    : restoredState?.ok
      ? restoredState
      : null;

  useEffect(() => {
    if (!result?.ok || !result.ticket) return;
    saveCheckinSession({
      officeId,
      ticketId: result.ticket.id,
      queueDate: result.ticket.queueDate || today,
      lookup: preview.id,
    });
  }, [result, officeId, preview.id, today]);

  const error =
    !lookupState.ok && lookupState.error ? lookupState.error : null;

  const statusMessage = useMemo(() => {
    if (dateStatus === "future") {
      return formatCopy(t.dateNotYet, preview.preferredDate || "—");
    }
    if (dateStatus === "past") {
      return formatCopy(t.datePassed, preview.preferredDate || "—");
    }
    if (dateStatus === "missing") {
      return t.notBookingRequest;
    }
    return null;
  }, [dateStatus, preview.preferredDate, t]);

  if (restoring && !result) {
    return (
      <div className="mx-auto max-w-lg">
        <CheckinSkeleton compact />
      </div>
    );
  }

  if (result?.ok && result.ticket) {
    if (result.ticket.status === "completed") {
      return (
        <QueueCompletedCitizenView
          locale={locale}
          ticket={result.ticket}
          officeNameAr={officeNameAr}
          citizenName={result.citizenName ?? preview.name}
        />
      );
    }
    return (
      <QueueWaitLive
        locale={locale}
        ticket={result.ticket}
        officeNameAr={officeNameAr}
        citizenName={result.citizenName ?? preview.name}
        initialPosition={result.initialPosition}
        iosHelp={iosHelp}
      />
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <article className="rounded-xl border border-gov-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-gov-accent">
          {t.requestSummary}
        </p>
        <p className="mt-2 font-heading text-2xl font-extrabold text-gov-navy">
          #{preview.id}
        </p>

        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="font-bold text-gov-navy">{t.officeLabel}</dt>
            <dd className="mt-1 text-gov-gray-700">{preview.officeNameAr}</dd>
          </div>
          <div>
            <dt className="font-bold text-gov-navy">{t.bookingDateLabel}</dt>
            <dd className="mt-1 font-mono text-gov-gray-700">
              {preview.preferredDate || "—"}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-gov-navy">{t.nameLabel}</dt>
            <dd className="mt-1 text-gov-gray-700">{preview.name}</dd>
          </div>
        </dl>
      </article>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900"
        >
          {error}
        </p>
      ) : null}

      {dateStatus === "today" ? (
        <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
          <p className="text-center text-sm font-bold leading-relaxed text-gov-navy">
            {t.confirmPrompt}
          </p>
          <form action={lookupAction}>
            <input type="hidden" name="officeId" value={officeId} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="lookup" value={preview.id} />
            <button
              type="submit"
              disabled={lookupPending}
              className="w-full rounded-md bg-gov-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-gov-navy disabled:opacity-60"
            >
              {lookupPending ? t.confirmPending : t.confirmButton}
            </button>
          </form>
        </div>
      ) : (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-center text-sm font-semibold leading-relaxed text-amber-950"
        >
          <p>{statusMessage}</p>
          {dateStatus === "future" && preview.preferredDate ? (
            <BookingDateCalendarReminder
              locale={locale}
              requestId={preview.id}
              preferredDate={preview.preferredDate}
              officeNameAr={preview.officeNameAr}
              officeId={officeId}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
