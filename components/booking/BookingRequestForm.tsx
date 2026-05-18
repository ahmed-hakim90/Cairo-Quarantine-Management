"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_GOVERNORATE_ID } from "@/data/governorates";
import {
  submitOfficeRequest,
  type BookingFormState,
} from "@/app/[locale]/(public)/booking/actions";
import { BookingPassSuccessBlock } from "@/components/booking/BookingPassSuccessBlock";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { getCairoMinBookingYmd } from "@/lib/cairo-today-ymd";
import { bookingRequestCopy } from "@/lib/i18n/booking-request-copy";
import type { Locale } from "@/lib/i18n/config";
import { publicTravelerCategoryLabels } from "@/lib/i18n/office-request-copy";
import {
  filterBookingOfficesForGovernorateAndTravelerState,
  filterOfficesForGovernorate,
} from "@/lib/office-requests/office-governorate";
import {
  defaultTravelerStatesFromLegacyLabels,
} from "@/lib/office-requests/office-traveler-state";
import {
  DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR,
  type Office,
  type PublicOfficeRequestStatus,
  type TravelerState,
} from "@/lib/office-requests/types";
import { feedbackToast } from "@/lib/ui/feedback-toast";

type BookingRequestFormProps = {
  offices: Office[];
  /** حالات المسافرين النشطة لنموذج الحجز؛ إن وُجدت فارغة يُستخدم الافتراضي الثلاثي. */
  travelerStates?: TravelerState[];
  locale: Locale;
  mode: "booking" | "complaint";
  /** Cairo same-day cutoff hour (0–23), from `settings/app` on booking page. */
  sameDayCutoffHour?: number;
  /** Public site origin from request headers (for QR / pass URL). */
  serverSiteOrigin: string;
};

type StoredRequest = PublicOfficeRequestStatus & {
  phone: string;
  passToken?: string;
};

const initialState: BookingFormState = {
  ok: false,
  message: "",
};

const STORAGE_KEY = "cairo-office-requests:v1";
const DUPLICATE_REDIRECT_DELAY_MS = 1500;

const inputClass =
  "mt-2 w-full rounded-md border border-gov-gray-200 bg-white px-3 py-3 text-sm text-gov-gray-900 outline-none transition focus:border-gov-accent focus:ring-2 focus:ring-gov-accent/20 disabled:bg-gov-gray-50 disabled:text-gov-gray-600";

const labelClass = "block text-sm font-bold text-gov-navy";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-sm font-semibold text-red-700">{message}</p>;
}

function saveRequestToDevice(request: StoredRequest) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const requests: StoredRequest[] = Array.isArray(current) ? current : [];
    const next = [
      request,
      ...requests.filter((item) => item?.id !== request.id),
    ].slice(0, 20);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([request]));
  }
}

export function BookingRequestForm({
  offices,
  travelerStates = [],
  locale,
  mode,
  sameDayCutoffHour = DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR,
  serverSiteOrigin,
}: BookingRequestFormProps) {
  const router = useRouter();
  const t = bookingRequestCopy[locale];
  const bookingStates = useMemo(
    () =>
      travelerStates.length > 0
        ? travelerStates
        : defaultTravelerStatesFromLegacyLabels(),
    [travelerStates],
  );

  const [state, action, pending] = useActionState(
    submitOfficeRequest,
    initialState,
  );
  const savedRequestId = useRef<string | null>(null);
  const lastToastKeyRef = useRef("");
  const lastDuplicateRedirectKeyRef = useRef("");
  const officeRef = useRef<HTMLSelectElement>(null);
  const travelerStateRef = useRef<HTMLSelectElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const preferredDateRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLTextAreaElement>(null);

  const [officeId, setOfficeId] = useState(state.values?.officeId ?? "");
  const governorateId = DEFAULT_GOVERNORATE_ID;
  const [preferredDate, setPreferredDate] = useState(
    state.values?.preferredDate ?? "",
  );
  const [travelerStateId, setTravelerStateId] = useState(
    state.values?.travelerStateId ?? "",
  );
  const [dayFull, setDayFull] = useState(false);
  const [availabilityHint, setAvailabilityHint] = useState<string | null>(
    null,
  );
  const [availabilityPending, setAvailabilityPending] = useState(false);

  const minYmd = useMemo(
    () => getCairoMinBookingYmd(new Date(), { sameDayCutoffHour }),
    [sameDayCutoffHour],
  );

  const allowedTravelerIds = useMemo(
    () => new Set(bookingStates.map((s) => s.id)),
    [bookingStates],
  );

  const filteredOffices = useMemo(() => {
    if (!governorateId) return [];
    const governorateOffices = filterOfficesForGovernorate(
      offices,
      governorateId,
    );
    if (mode !== "booking") return governorateOffices;
    if (!travelerStateId || !allowedTravelerIds.has(travelerStateId)) {
      return [];
    }
    return filterBookingOfficesForGovernorateAndTravelerState(
      offices,
      governorateId,
      travelerStateId,
    );
  }, [mode, offices, governorateId, travelerStateId, allowedTravelerIds]);

  const travelerChosen =
    mode !== "booking" ||
    (Boolean(travelerStateId) && allowedTravelerIds.has(travelerStateId));

  const bookingNoMatchingOffices =
    mode === "booking" && travelerChosen && filteredOffices.length === 0;

  function travelerStateLabel(state: TravelerState): string {
    if (state.id in publicTravelerCategoryLabels[locale]) {
      return publicTravelerCategoryLabels[locale][
        state.id as keyof (typeof publicTravelerCategoryLabels)[typeof locale]
      ];
    }
    return state.labelAr;
  }

  useEffect(() => {
    if (!travelerChosen) return;
    const allowed = new Set(filteredOffices.map((o) => o.id));
    if (officeId && !allowed.has(officeId)) {
      const id = requestAnimationFrame(() => setOfficeId(""));
      return () => cancelAnimationFrame(id);
    }
  }, [travelerChosen, filteredOffices, officeId]);

  useEffect(() => {
    if (!state.message) return;
    if (state.duplicate && !state.ok) return;
    const key = `${state.ok}:${state.message}`;
    if (lastToastKeyRef.current === key) return;
    lastToastKeyRef.current = key;
    if (state.ok) {
      feedbackToast.success(state.message);
    } else {
      feedbackToast.error(state.message);
    }
  }, [state.ok, state.message, state.duplicate]);

  useEffect(() => {
    if (!state.duplicate || state.ok || !state.message) return;
    const key = state.message;
    if (lastDuplicateRedirectKeyRef.current === key) return;
    lastDuplicateRedirectKeyRef.current = key;

    feedbackToast.error(state.message);
    const timer = window.setTimeout(() => {
      router.push(`/${locale}/my-requests`);
    }, DUPLICATE_REDIRECT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [state.duplicate, state.ok, state.message, locale, router]);

  useEffect(() => {
    if (state.ok || !state.values) return;
    const id = requestAnimationFrame(() => {
      setOfficeId(state.values!.officeId);
      setPreferredDate(state.values!.preferredDate ?? "");
      setTravelerStateId(state.values!.travelerStateId ?? "");
    });
    return () => cancelAnimationFrame(id);
  }, [state.ok, state.values]);

  useEffect(() => {
    if (
      !state.ok ||
      !state.request ||
      savedRequestId.current === state.request.id
    ) {
      return;
    }

    saveRequestToDevice(state.request);
    savedRequestId.current = state.request.id;
  }, [state.ok, state.request]);

  useEffect(() => {
    if (!state.errors) return;

    const fields = {
      officeId: officeRef,
      travelerStateId: travelerStateRef,
      type: typeRef,
      preferredDate: preferredDateRef,
      name: nameRef,
      phone: phoneRef,
      details: detailsRef,
    };
    const firstError = Object.keys(fields).find((key) => state.errors?.[key]);
    const field = firstError
      ? fields[firstError as keyof typeof fields].current
      : null;

    field?.focus();
    field?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state.errors]);

  useEffect(() => {
    if (mode !== "booking") {
      const id = requestAnimationFrame(() => {
        setDayFull(false);
        setAvailabilityHint(null);
        setAvailabilityPending(false);
      });
      return () => cancelAnimationFrame(id);
    }

    const oid = officeId.trim();
    const d = preferredDate.trim();
    if (!oid || !/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const clearId = requestAnimationFrame(() => {
        setDayFull(false);
        setAvailabilityHint(null);
        setAvailabilityPending(false);
      });
      return () => cancelAnimationFrame(clearId);
    }

    const ac = new AbortController();
    const pendingId = requestAnimationFrame(() => {
      setAvailabilityPending(true);
    });
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/booking/availability?officeId=${encodeURIComponent(oid)}&preferredDate=${encodeURIComponent(d)}`,
          { signal: ac.signal },
        );
        const data = (await res.json()) as {
          available?: boolean;
          fullMessage?: string;
        };
        if (ac.signal.aborted) return;
        const full = res.ok && data.available === false;
        setDayFull(full);
        setAvailabilityHint(full ? t.dayFull : null);
      } catch {
        if (!ac.signal.aborted) {
          setDayFull(false);
          setAvailabilityHint(null);
        }
      } finally {
        if (!ac.signal.aborted) setAvailabilityPending(false);
      }
    }, 350);

    return () => {
      cancelAnimationFrame(pendingId);
      ac.abort();
      window.clearTimeout(timer);
    };
  }, [mode, officeId, preferredDate, t.dayFull]);

  const bookingBlocked =
    mode === "booking" && (dayFull || availabilityPending);

  const preferredDateError =
    state.errors?.preferredDate ?? availabilityHint ?? undefined;

  return (
    <form action={action} className="space-y-0">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="governorateId" value={governorateId} />
      {mode === "booking" ? (
        <input type="hidden" name="type" value="booking" />
      ) : null}
      <div className="border-b border-gov-gray-200 px-5 py-4 md:px-7">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-md bg-gov-accent-muted text-sm font-extrabold text-gov-navy">
            1
          </span>
          <div>
            <h2 className="font-heading text-lg font-extrabold text-gov-navy">
              {mode === "booking" ? t.bookingTitle : t.complaintTitle}
            </h2>
            <p className="mt-1 text-sm text-gov-gray-600">
              {mode === "booking"
                ? t.bookingIntro
                : t.complaintIntro}
            </p>
          </div>
        </div>
      </div>

      {state.message ? (
        <div
          className={`mx-5 mt-5 rounded-md border px-4 py-3 text-sm font-bold md:mx-7 ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="status"
        >
          {state.message}
          {state.duplicate && !state.ok ? (
            <LocaleLink
              locale={locale}
              href="/my-requests"
              className="mt-3 inline-flex min-h-10 items-center rounded-md bg-gov-accent px-4 text-sm font-bold text-white transition hover:bg-gov-navy"
            >
              {t.duplicateLink}
            </LocaleLink>
          ) : null}
          {state.ok && state.request ? (
            <div className="mt-3 rounded-md bg-white/70 p-3 text-gov-navy">
              <p>
                {t.requestId}:{" "}
                <span className="font-extrabold">#{state.request.id}</span>
              </p>
              <LocaleLink
                locale={locale}
                href="/my-requests"
                className="mt-2 inline-flex min-h-10 items-center rounded-md bg-gov-accent px-4 text-sm font-bold text-white transition hover:bg-gov-navy"
              >
                {t.followRequests}
              </LocaleLink>
              <BookingPassSuccessBlock
                locale={locale}
                request={state.request}
                serverSiteOrigin={serverSiteOrigin}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-6 px-5 py-5 md:px-7">
        {offices.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            {t.officesNotLoaded}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          {mode === "booking" ? (
            <>
              <label className={labelClass}>
                {t.travelerState}
                <select
                  ref={travelerStateRef}
                  name="travelerStateId"
                  required
                  className={inputClass}
                  value={travelerStateId}
                  onChange={(e) => setTravelerStateId(e.target.value)}
                >
                  <option value="" disabled>
                    {t.chooseTravelerState}
                  </option>
                  {bookingStates.map((s) => (
                    <option key={s.id} value={s.id}>
                      {travelerStateLabel(s)}
                    </option>
                  ))}
                </select>
                <FieldError message={state.errors?.travelerStateId} />
              </label>
              <label className={labelClass}>
                {t.officeName}
                <select
                  ref={officeRef}
                  name="officeId"
                  required
                  className={inputClass}
                  value={officeId}
                  onChange={(e) => setOfficeId(e.target.value)}
                  disabled={offices.length === 0 || !travelerChosen}
                >
                  <option value="" disabled>
                    {!travelerChosen ? t.chooseTravelerFirst : t.chooseOffice}
                  </option>
                  {filteredOffices.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.nameAr}
                    </option>
                  ))}
                </select>
                {bookingNoMatchingOffices ? (
                  <p className="mt-2 text-sm font-semibold text-amber-800">
                    {t.noMatchingOffices}
                  </p>
                ) : null}
                <FieldError message={state.errors?.officeId} />
              </label>
            </>
          ) : (
            <>
              <label className={labelClass}>
                {t.officeName}
                <select
                  ref={officeRef}
                  name="officeId"
                  required
                  className={inputClass}
                  value={officeId}
                  onChange={(e) => setOfficeId(e.target.value)}
                  disabled={offices.length === 0}
                >
                  <option value="" disabled>
                    {t.chooseOffice}
                  </option>
                  {filteredOffices.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.nameAr}
                    </option>
                  ))}
                </select>
                <FieldError message={state.errors?.officeId} />
              </label>
              <label className={labelClass}>
                {t.followUpType}
                <select
                  ref={typeRef}
                  name="type"
                  required
                  className={inputClass}
                  defaultValue={state.values?.type ?? "complaint"}
                >
                  <option value="complaint">{t.complaintOption}</option>
                  <option value="proposal">{t.proposalOption}</option>
                </select>
                <FieldError message={state.errors?.type} />
              </label>
            </>
          )}
        </div>

        {mode === "booking" ? (
          <label className={labelClass}>
            {t.preferredDate}
            <input
              ref={preferredDateRef}
              name="preferredDate"
              type="date"
              required
              min={minYmd}
              className={inputClass}
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
            />
            {availabilityPending ? (
              <p className="mt-1 text-xs text-gov-gray-600">
                {t.checkingAvailability}
              </p>
            ) : null}
            <FieldError message={preferredDateError} />
          </label>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            {t.name}
            <input
              ref={nameRef}
              name="name"
              required
              minLength={2}
              autoComplete="name"
              className={inputClass}
              placeholder={t.namePlaceholder}
              defaultValue={state.values?.name ?? ""}
            />
            <FieldError message={state.errors?.name} />
          </label>

          <label className={labelClass}>
            {t.phone}
            <input
              ref={phoneRef}
              name="phone"
              required
              inputMode="tel"
              autoComplete="tel"
              className={inputClass}
              placeholder={t.phonePlaceholder}
              defaultValue={state.values?.phone ?? ""}
            />
            <FieldError message={state.errors?.phone} />
          </label>
        </div>

        {mode === "booking" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-5">
            <label className="flex items-center gap-2 text-sm font-semibold text-gov-gray-800">
              <input
                type="checkbox"
                name="hasSpecialNeeds"
                defaultChecked={state.values?.hasSpecialNeeds ?? false}
                className="size-4 rounded border-gov-gray-300"
              />
              <span>{t.specialNeeds}</span>
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gov-gray-800">
              <input
                type="checkbox"
                name="hasElderly"
                defaultChecked={state.values?.hasElderly ?? false}
                className="size-4 rounded border-gov-gray-300"
              />
              <span>{t.elderly}</span>
            </label>
          </div>
        ) : null}

        <label className={labelClass}>
          {mode === "booking" ? t.bookingDetails : t.complaintDetails}
          <textarea
            ref={detailsRef}
            name="details"
            required={mode !== "booking"}
            minLength={mode === "booking" ? undefined : 5}
            rows={6}
            className={`${inputClass} resize-y leading-relaxed`}
            placeholder={
              mode === "booking"
                ? t.bookingDetailsPlaceholder
                : t.complaintDetailsPlaceholder
            }
            defaultValue={state.values?.details ?? ""}
          />
          <FieldError message={state.errors?.details} />
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-gov-gray-200 bg-gov-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-7">
        <p className="text-sm leading-relaxed text-gov-gray-600">
          {mode === "booking"
            ? t.bookingSubmitHint
            : t.complaintSubmitHint}
        </p>
        <button
          type="submit"
          disabled={
            pending ||
            offices.length === 0 ||
            bookingBlocked ||
            bookingNoMatchingOffices
          }
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-gov-accent px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-gov-navy disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? t.sending
            : mode === "booking"
              ? t.sendBooking
              : t.sendFollowUp}
        </button>
      </div>
    </form>
  );
}
