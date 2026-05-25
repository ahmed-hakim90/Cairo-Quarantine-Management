"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEFAULT_GOVERNORATE_ID } from "@/data/governorates";
import {
  submitOfficeRequest,
  type BookingFormState,
} from "@/app/[locale]/(public)/booking/actions";
import { useOptionalPublicAnalytics } from "@/components/analytics/PublicAnalyticsProvider";
import { BookingAvailableDatePicker } from "@/components/booking/BookingAvailableDatePicker";
import { BookingRequestSuccessView } from "@/components/booking/BookingRequestSuccessView";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import {
  getCairoMinBookingYmd,
  getCairoYmdDaysAfter,
} from "@/lib/cairo-today-ymd";
import { BOOKING_DATE_HORIZON_DAYS } from "@/lib/office-requests/booking-constants";
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
  type TravelerState,
} from "@/lib/office-requests/types";
import {
  upsertStoredRequest,
  type StoredOfficeRequest,
} from "@/lib/office-requests/my-requests-storage";
import { SkeletonButton } from "@/components/skeletons/primitives";
import { feedbackToast } from "@/lib/ui/feedback-toast";

type BookingRequestFormProps = {
  offices: Office[];
  travelerStates?: TravelerState[];
  locale: Locale;
  mode: "booking" | "complaint";
  sameDayCutoffHour?: number;
  serverSiteOrigin: string;
};

type StoredRequest = StoredOfficeRequest;

type LastSuccess = {
  message: string;
  request: StoredRequest;
  contactName?: string;
};

const initialState: BookingFormState = {
  ok: false,
  message: "",
};

const DUPLICATE_REDIRECT_DELAY_MS = 1500;

const inputClass =
  "mt-2 w-full min-h-12 rounded-md border border-gov-gray-200 bg-white px-3.5 py-3 text-base text-gov-gray-900 outline-none transition focus:border-gov-accent focus:ring-2 focus:ring-gov-accent/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-accent disabled:bg-gov-gray-50 disabled:text-gov-gray-600 sm:min-h-0 sm:px-3 sm:py-3 sm:text-sm";

const labelClass = "block text-sm font-bold text-gov-navy";

const fieldGroupClass =
  "space-y-5 rounded-lg border border-gov-gray-100 bg-gov-gray-50/40 p-4 max-sm:p-3.5 lg:border-transparent lg:bg-transparent lg:p-0";

const fieldGroupLegendClass =
  "mb-1 px-0 text-sm font-extrabold text-gov-navy lg:sr-only";

const checkboxLabelClass =
  "flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-gov-gray-800 sm:min-h-0";

const checkboxInputClass =
  "size-5 shrink-0 rounded border-gov-gray-300 text-gov-accent focus:ring-gov-accent/20";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-sm font-semibold text-red-700">{message}</p>;
}

export function BookingRequestForm(props: BookingRequestFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale } = props;

  const [formKey, setFormKey] = useState(0);
  const [showForm, setShowForm] = useState(true);
  const [lastSuccess, setLastSuccess] = useState<LastSuccess | null>(null);

  const handleSuccess = useCallback((success: LastSuccess) => {
    setLastSuccess(success);
    setShowForm(false);
  }, []);

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setShowForm(true);
    setLastSuccess(null);
    setFormKey((k) => k + 1);
    router.replace(pathname);
  }, [searchParams, pathname, router]);

  if (!showForm && lastSuccess) {
    return (
      <BookingRequestSuccessView
        locale={locale}
        message={lastSuccess.message}
        request={lastSuccess.request}
        contactName={lastSuccess.contactName}
        serverSiteOrigin={props.serverSiteOrigin}
      />
    );
  }

  return (
    <BookingRequestFormFields
      key={formKey}
      {...props}
      onSuccess={handleSuccess}
    />
  );
}

type BookingRequestFormFieldsProps = BookingRequestFormProps & {
  onSuccess: (success: LastSuccess) => void;
};

function BookingRequestFormFields({
  offices,
  travelerStates = [],
  locale,
  mode,
  sameDayCutoffHour = DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR,
  onSuccess,
}: BookingRequestFormFieldsProps) {
  const router = useRouter();
  const t = bookingRequestCopy[locale];
  const analytics = useOptionalPublicAnalytics();
  const formType = mode === "booking" ? "booking" : "complaint";
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
  const lastToastKeyRef = useRef("");
  const lastDuplicateRedirectKeyRef = useRef("");
  const savedRequestIdRef = useRef<string | null>(null);
  const officeRef = useRef<HTMLSelectElement>(null);
  const travelerStateRef = useRef<HTMLSelectElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const preferredDateRef = useRef<HTMLDivElement>(null);
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

  const minYmd = useMemo(
    () => getCairoMinBookingYmd(new Date(), { sameDayCutoffHour }),
    [sameDayCutoffHour],
  );

  const [availableDates, setAvailableDates] = useState<Set<string>>(
    () => new Set(),
  );
  const [fullDates, setFullDates] = useState<Set<string>>(() => new Set());
  const [datesLoading, setDatesLoading] = useState(false);
  const [datesFrom, setDatesFrom] = useState("");
  const [datesTo, setDatesTo] = useState("");

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
    analytics?.trackFormStart(formType, "open");
  }, [analytics, formType]);

  useEffect(() => {
    if (!state.ok || !state.request) return;
    analytics?.trackSubmitSuccess(formType, state.request.id);
  }, [analytics, formType, state.ok, state.request]);

  useEffect(() => {
    if (state.ok || !state.errors || !analytics) return;
    analytics.trackFormStep({
      formType,
      step: "validation_error",
      officeId: state.values?.officeId,
      phone: state.values?.phone,
      preferredDate: state.values?.preferredDate,
    });
  }, [analytics, formType, state.ok, state.errors, state.values]);

  useEffect(() => {
    if (!officeId.trim()) return;
    analytics?.trackFormStep({
      formType,
      step: "office",
      officeId,
    });
  }, [analytics, formType, officeId]);

  useEffect(() => {
    if (mode !== "booking" || !travelerStateId) return;
    analytics?.trackFormStep({
      formType,
      step: "traveler_state",
      officeId: officeId || undefined,
    });
  }, [analytics, formType, mode, travelerStateId, officeId]);

  useEffect(() => {
    if (mode !== "booking" || !preferredDate) return;
    analytics?.trackFormStep({
      formType,
      step: "preferred_date",
      officeId: officeId || undefined,
      preferredDate,
    });
  }, [analytics, formType, mode, preferredDate, officeId]);

  useEffect(() => {
    if (!state.ok || !state.request) return;
    onSuccess({
      message: state.message,
      request: state.request,
      contactName: state.values?.name,
    });
  }, [state.ok, state.request, state.message, state.values?.name, onSuccess]);

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
      savedRequestIdRef.current === state.request.id
    ) {
      return;
    }

    upsertStoredRequest(state.request);
    savedRequestIdRef.current = state.request.id;
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
    if (mode !== "booking") return;

    const oid = officeId.trim();
    if (!oid) {
      const id = requestAnimationFrame(() => {
        setAvailableDates(new Set());
        setFullDates(new Set());
        setDatesLoading(false);
        setDatesFrom("");
        setDatesTo("");
        setPreferredDate("");
      });
      return () => cancelAnimationFrame(id);
    }

    const ac = new AbortController();
    const pendingId = requestAnimationFrame(() => {
      setDatesLoading(true);
    });

    void (async () => {
      try {
        const res = await fetch(
          `/api/booking/available-dates?officeId=${encodeURIComponent(oid)}`,
          { signal: ac.signal },
        );
        const data = (await res.json()) as {
          dates?: string[];
          fullDates?: string[];
          from?: string;
          to?: string;
        };
        if (ac.signal.aborted) return;
        if (!res.ok) {
          setAvailableDates(new Set());
          setFullDates(new Set());
          setDatesFrom(minYmd);
          setDatesTo(getCairoYmdDaysAfter(BOOKING_DATE_HORIZON_DAYS, minYmd));
          analytics?.trackApiError("booking_available_dates");
          return;
        }
        const nextAvailable = new Set(data.dates ?? []);
        const nextFull = new Set(data.fullDates ?? []);
        const from = data.from ?? minYmd;
        const to =
          data.to ?? getCairoYmdDaysAfter(BOOKING_DATE_HORIZON_DAYS, minYmd);
        setAvailableDates(nextAvailable);
        setFullDates(nextFull);
        setDatesFrom(from);
        setDatesTo(to);
        setPreferredDate((current) => {
          if (current && nextAvailable.has(current)) return current;
          const sorted = [...nextAvailable].sort();
          return sorted[0] ?? "";
        });
      } catch {
        if (!ac.signal.aborted) {
          setAvailableDates(new Set());
          setFullDates(new Set());
          setDatesFrom(minYmd);
          setDatesTo(getCairoYmdDaysAfter(BOOKING_DATE_HORIZON_DAYS, minYmd));
          analytics?.trackApiError("booking_available_dates_fetch");
        }
      } finally {
        if (!ac.signal.aborted) setDatesLoading(false);
      }
    })();

    return () => {
      cancelAnimationFrame(pendingId);
      ac.abort();
    };
  }, [mode, officeId, minYmd, analytics]);

  const officeSelected = Boolean(officeId.trim());
  const noAvailableDates =
    mode === "booking" &&
    officeSelected &&
    !datesLoading &&
    availableDates.size === 0;

  const bookingBlocked =
    mode === "booking" &&
    (datesLoading ||
      noAvailableDates ||
      (officeSelected && !preferredDate.trim()));

  const preferredDateError =
    state.errors?.preferredDate ??
    (noAvailableDates ? t.noAvailableDates : undefined);

  return (
    <form
      action={action}
      className={`relative space-y-0 ${pending ? "opacity-90" : ""}`}
      aria-busy={pending || datesLoading ? true : undefined}
      onSubmit={() => analytics?.trackSubmitAttempt(formType)}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="governorateId" value={governorateId} />
      {analytics ? (
        <input
          type="hidden"
          name="analyticsSessionId"
          value={analytics.sessionId}
        />
      ) : null}
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

      {state.message && !state.ok ? (
        <div
          className="mx-5 mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800 md:mx-7"
          role="status"
        >
          {state.message}
          {state.duplicate ? (
            <LocaleLink
              locale={locale}
              href="/my-requests"
              className="mt-3 inline-flex min-h-10 items-center rounded-md bg-gov-accent px-4 text-sm font-bold text-white transition hover:bg-gov-navy"
            >
              {t.duplicateLink}
            </LocaleLink>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-6 px-5 py-5 md:px-7">
        {offices.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            {t.officesNotLoaded}
          </div>
        ) : null}

        <fieldset className={fieldGroupClass}>
          <legend className={fieldGroupLegendClass}>{t.formSectionOffice}</legend>
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
                      {!travelerChosen
                        ? t.chooseTravelerFirst
                        : t.chooseOffice}
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
            <div>
              <span className={labelClass}>{t.preferredDate}</span>
              <BookingAvailableDatePicker
                locale={locale}
                name="preferredDate"
                value={preferredDate}
                onChange={setPreferredDate}
                availableDates={availableDates}
                fullDates={fullDates}
                fromYmd={datesFrom || minYmd}
                toYmd={
                  datesTo ||
                  getCairoYmdDaysAfter(BOOKING_DATE_HORIZON_DAYS, minYmd)
                }
                loading={datesLoading && officeSelected}
                disabled={!officeSelected}
                disabledHint={
                  !officeSelected ? t.chooseOfficeFirstForDate : undefined
                }
                placeholderLabel={t.datePlaceholder}
                loadingLabel={t.loadingAvailableDates}
                prevMonthLabel={t.calendarPrevMonth}
                nextMonthLabel={t.calendarNextMonth}
                containerRef={preferredDateRef}
              />
              <FieldError message={preferredDateError} />
            </div>
          ) : null}
        </fieldset>

        <fieldset className={fieldGroupClass}>
          <legend className={fieldGroupLegendClass}>{t.formSectionContact}</legend>
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
        </fieldset>

        <fieldset className={fieldGroupClass}>
          <legend className={fieldGroupLegendClass}>{t.formSectionDetails}</legend>
          {mode === "booking" ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-5">
              <label className={checkboxLabelClass}>
                <input
                  type="checkbox"
                  name="hasSpecialNeeds"
                  defaultChecked={state.values?.hasSpecialNeeds ?? false}
                  className={checkboxInputClass}
                />
                <span>{t.specialNeeds}</span>
              </label>
              <label className={checkboxLabelClass}>
                <input
                  type="checkbox"
                  name="hasElderly"
                  defaultChecked={state.values?.hasElderly ?? false}
                  className={checkboxInputClass}
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
              rows={4}
              className={`${inputClass} min-h-[6.5rem] resize-y leading-relaxed sm:min-h-[9rem]`}
              placeholder={
                mode === "booking"
                  ? t.bookingDetailsPlaceholder
                  : t.complaintDetailsPlaceholder
              }
              defaultValue={state.values?.details ?? ""}
            />
            <FieldError message={state.errors?.details} />
          </label>
        </fieldset>
      </div>

      <div className="border-t border-gov-gray-200 px-5 py-4 md:hidden">
        {pending ? (
          <SkeletonButton className="h-12 w-full" aria-hidden />
        ) : (
          <button
            type="submit"
            disabled={
              offices.length === 0 ||
              bookingBlocked ||
              bookingNoMatchingOffices
            }
            className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-brand-accent px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode === "booking" ? t.sendBooking : t.sendFollowUp}
          </button>
        )}
        {pending ? (
          <p className="sr-only" role="status">
            {t.sending}
          </p>
        ) : null}
      </div>

      <div className="hidden flex-col-reverse gap-3 border-t border-gov-gray-200 bg-gov-gray-50 px-5 py-4 md:flex md:flex-row md:items-center md:justify-between md:px-7">
        <p className="text-xs leading-relaxed text-gov-gray-600 md:text-sm">
          {mode === "booking"
            ? t.bookingSubmitHint
            : t.complaintSubmitHint}
        </p>
        {pending ? (
          <div className="w-full shrink-0 md:w-auto" aria-hidden>
            <SkeletonButton className="h-11 w-40" />
          </div>
        ) : (
          <button
            type="submit"
            disabled={
              offices.length === 0 ||
              bookingBlocked ||
              bookingNoMatchingOffices
            }
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-md bg-brand-accent px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
          >
            {mode === "booking" ? t.sendBooking : t.sendFollowUp}
          </button>
        )}
        {pending ? (
          <p className="sr-only" role="status">
            {t.sending}
          </p>
        ) : null}
      </div>
    </form>
  );
}
