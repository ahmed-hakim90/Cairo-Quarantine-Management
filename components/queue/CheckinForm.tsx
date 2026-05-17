"use client";

import { useActionState } from "react";
import { QueueCompletedCitizenView } from "@/components/queue/QueueCompletedCitizenView";
import { QueueWaitLive } from "@/components/queue/QueueWaitLive";
import {
  checkinLookupAction,
  checkinQuickAction,
  type CheckinState,
} from "@/app/[locale]/(public)/checkin/actions";
import type { Locale } from "@/lib/i18n/config";
import type { TravelerState } from "@/lib/office-requests/types";

const initial: CheckinState = { ok: false };

type CheckinFormProps = {
  locale: Locale;
  officeId: string;
  officeNameAr: string;
  travelerStates: TravelerState[];
  serverSiteOrigin: string;
  iosHelp: string;
};

export function CheckinForm({
  locale,
  officeId,
  officeNameAr,
  travelerStates,
  serverSiteOrigin,
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

  const result = lookupState.ok
    ? lookupState
    : quickState.ok
      ? quickState
      : null;
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

  if (result?.ok && result.ticket) {
    if (result.ticket.status === "completed") {
      return (
        <QueueCompletedCitizenView
          locale={locale}
          ticket={result.ticket}
          officeNameAr={officeNameAr}
          citizenName={result.citizenName}
          passToken={result.passToken}
          requestType={result.requestType}
          requestId={result.requestId}
          requestOfficeNameAr={result.officeNameAr}
          preferredDate={result.preferredDate}
          serverSiteOrigin={serverSiteOrigin}
        />
      );
    }
    return (
      <QueueWaitLive
        locale={locale}
        ticket={result.ticket}
        officeNameAr={officeNameAr}
        citizenName={result.citizenName}
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
            autoComplete="off"
            className="mt-2 w-full rounded-md border border-gov-gray-200 px-3 py-2.5 text-sm"
            placeholder="مثال: CQM-000123 أو 010…"
          />
        </div>
        <button
          type="submit"
          disabled={lookupPending}
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
              !lookupState.ok ? (lookupState.lookupValue ?? "") : ""
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
            disabled={quickPending}
            className="w-full rounded-md bg-gov-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {quickPending ? "جاري التسجيل…" : "إنشاء طلب وتسجيل الحضور"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
