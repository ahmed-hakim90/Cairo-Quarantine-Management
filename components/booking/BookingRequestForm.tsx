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
import { BookingRequestSuccessView } from "@/components/booking/BookingRequestSuccessView";
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
import { SkeletonBlock, SkeletonButton } from "@/components/skeletons/primitives";
import { feedbackToast } from "@/lib/ui/feedback-toast";

type BookingRequestFormProps = {
  offices: Office[];
  travelerStates?: TravelerState[];
  locale: Locale;
  mode: "booking" | "complaint";
  sameDayCutoffHour?: number;
  serverSiteOrigin: string;
};

type StoredRequest = PublicOfficeRequestStatus & {
  phone: string;
  passToken?: string;
};

type LastSuccess = {
  message: string;
  request: StoredRequest;
  contactName?: string;
};

const initialState: BookingFormState = {
  ok: false,
  message: "",
};

const STORAGE_KEY = "cairo-office-requests:v1";
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
    <form
      action={action}
      className={`relative space-y-0 ${pending ? "opacity-90" : ""}`}
      aria-busy={pending || availabilityPending ? true : undefined}
    >
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
                <div
                  className="mt-2 space-y-1"
                  role="status"
                  aria-live="polite"
                >
                  <SkeletonBlock className="h-3 w-40" />
                  <p className="sr-only">{t.checkingAvailability}</p>
                </div>
              ) : null}
              <FieldError message={preferredDateError} />
            </label>
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

      <div className="flex flex-col-reverse gap-3 border-t border-gov-gray-200 bg-gov-gray-50 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:pb-4 md:px-7">
        <p className="text-xs leading-relaxed text-gov-gray-600 sm:text-sm">
          {mode === "booking"
            ? t.bookingSubmitHint
            : t.complaintSubmitHint}
        </p>
        {pending ? (
          <div className="w-full shrink-0 sm:w-auto" aria-hidden>
            <SkeletonButton className="h-12 w-full min-w-[8rem] sm:h-11 sm:w-40" />
          </div>
        ) : (
          <button
            type="submit"
            disabled={
              offices.length === 0 ||
              bookingBlocked ||
              bookingNoMatchingOffices
            }
            className="inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-md bg-gov-accent px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-gov-navy disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:w-auto sm:text-sm"
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
