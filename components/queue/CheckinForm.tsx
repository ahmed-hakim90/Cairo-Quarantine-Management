"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { QueueCompletedCitizenView } from "@/components/queue/QueueCompletedCitizenView";
import { QueueWaitLive } from "@/components/queue/QueueWaitLive";
import {
  checkinLookupAction,
  checkinQuickAction,
  checkinRestoreAction,
  type CheckinState,
} from "@/app/[locale]/(public)/checkin/actions";
import { getCairoTodayYmd } from "@/lib/cairo-today-ymd";
import type { Locale } from "@/lib/i18n/config";
import {
  clearCheckinSession,
  loadCheckinLookup,
  loadCheckinSession,
  saveCheckinLookupDraft,
  saveCheckinSession,
} from "@/lib/queue/checkin-session-storage";
import type { TravelerState } from "@/lib/office-requests/types";

const initial: CheckinState = { ok: false };

type CheckinFormProps = {
  locale: Locale;
  officeId: string;
  officeNameAr: string;
  travelerStates: TravelerState[];
  iosHelp: string;
};

export function CheckinForm({
  locale,
  officeId,
  officeNameAr,
  travelerStates,
  iosHelp,
}: CheckinFormProps) {
  const [lookupState, lookupAction, lookupPending] = useActionState(
    checkinLookupAction,
    initial,
  );
  const [quickState, quickAction, quickPending] = useActionState(
    checkinQuickAction,
    initial,
  );
  const [restoredState, setRestoredState] = useState<CheckinState | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [lookupValue, setLookupValue] = useState("");

  useEffect(() => {
    const lookupTimer = window.setTimeout(() => {
      setLookupValue(loadCheckinLookup(officeId));
    }, 0);

    let cancelled = false;
    const session = loadCheckinSession(officeId);

    if (!session?.ticketId) {
      return () => {
        cancelled = true;
        window.clearTimeout(lookupTimer);
      };
    }

    const restoreTimer = window.setTimeout(() => setRestoring(true), 0);

    void checkinRestoreAction(officeId, session.ticketId).then((state) => {
      if (cancelled) return;
      if (state.ok) {
        setRestoredState({
          ...state,
          ...(session.lookup ? { lookup: session.lookup } : {}),
        });
        if (session.lookup) {
          window.setTimeout(() => setLookupValue(session.lookup!), 0);
        }
      } else {
        clearCheckinSession(officeId);
      }
      setRestoring(false);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(lookupTimer);
      window.clearTimeout(restoreTimer);
    };
  }, [officeId]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      saveCheckinLookupDraft(officeId, lookupValue);
    }, 400);
    return () => window.clearTimeout(id);
  }, [lookupValue, officeId]);

  const actionResult = lookupState.ok
    ? lookupState
    : quickState.ok
      ? quickState
      : null;

  const result =
    actionResult ?? (restoredState?.ok ? restoredState : null);

  useEffect(() => {
    if (!result?.ok || !result.ticket) return;
    saveCheckinSession({
      officeId,
      ticketId: result.ticket.id,
      queueDate: result.ticket.queueDate || getCairoTodayYmd(),
      ...(result.lookup ? { lookup: result.lookup } : {}),
      ...(lookupValue.trim() && !result.lookup
        ? { lookup: lookupValue.trim() }
        : {}),
    });
  }, [result, officeId, lookupValue]);

  const error =
    !lookupState.ok && lookupState.error
      ? lookupState.error
      : !quickState.ok && quickState.error
        ? quickState.error
        : null;
  const showQuick =
    !result?.ok &&
    !lookupState.ok &&
    lookupState.needsQuickForm === true &&
    !lookupPending &&
    !quickPending;

  const isBusy = useMemo(
    () => lookupPending || quickPending || restoring,
    [lookupPending, quickPending, restoring],
  );

  if (restoring && !result) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-gov-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-gov-gray-700">
          جاري استعادة دورك…
        </p>
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
          citizenName={result.citizenName}
        />
      );
    }
    return (
      <QueueWaitLive
        locale={locale}
        ticket={result.ticket}
        officeNameAr={officeNameAr}
        citizenName={result.citizenName}
        initialPosition={result.initialPosition}
        iosHelp={iosHelp}
      />
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900"
        >
          {error}
        </p>
      ) : null}

      <form action={lookupAction} className="space-y-4 rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
        <input type="hidden" name="officeId" value={officeId} />
        <div>
          <label htmlFor="lookup" className="block text-sm font-bold text-gov-navy">
            رقم الطلب أو رقم الهاتف
          </label>
          <input
            id="lookup"
            name="lookup"
            type="text"
            required
            autoComplete="tel"
            value={lookupValue}
            onChange={(e) => setLookupValue(e.target.value)}
            className="mt-2 w-full rounded-md border border-gov-gray-200 px-3 py-2.5 text-sm"
            placeholder="مثال: CQM-000123 أو 010…"
          />
        </div>
        <button
          type="submit"
          disabled={isBusy}
          className="w-full rounded-md bg-gov-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-gov-navy disabled:opacity-60"
        >
          {lookupPending ? "جاري التحقق…" : "تسجيل الحضور"}
        </button>
      </form>

      {showQuick ? (
        <form action={quickAction} className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/50 p-5">
          <p className="text-sm font-bold text-gov-navy">
            لم يُعثر على طلب — يمكنك إنشاء طلب حضور سريع
          </p>
          <input type="hidden" name="officeId" value={officeId} />
          <input
            type="hidden"
            name="lookup"
            value={
              !lookupState.ok ? (lookupState.lookupValue ?? lookupValue) : lookupValue
            }
          />
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-gov-navy">
              الاسم
            </label>
            <input
              id="name"
              name="name"
              required
              className="mt-2 w-full rounded-md border border-gov-gray-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-bold text-gov-navy">
              رقم الهاتف
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={lookupValue}
              className="mt-2 w-full rounded-md border border-gov-gray-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="travelerStateId"
              className="block text-sm font-bold text-gov-navy"
            >
              حالة المسافر
            </label>
            <select
              id="travelerStateId"
              name="travelerStateId"
              required
              className="mt-2 w-full rounded-md border border-gov-gray-200 bg-white px-3 py-2.5 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                اختر حالة المسافر
              </option>
              {travelerStates.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.labelAr}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gov-gray-800">
            <input
              type="checkbox"
              name="hasSpecialNeeds"
              className="size-4 rounded border-gov-gray-300"
            />
            <span>ذوي همم</span>
          </label>
          <div>
            <label htmlFor="details" className="block text-sm font-bold text-gov-navy">
              ملاحظات (اختياري)
            </label>
            <textarea
              id="details"
              name="details"
              rows={2}
              className="mt-2 w-full rounded-md border border-gov-gray-200 px-3 py-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isBusy}
            className="w-full rounded-md bg-gov-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {quickPending ? "جاري التسجيل…" : "إنشاء طلب وتسجيل الحضور"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
