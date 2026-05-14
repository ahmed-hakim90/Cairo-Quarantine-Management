"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  submitOfficeRequest,
  type BookingFormState,
} from "@/app/[locale]/booking/actions";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import type { Locale } from "@/lib/i18n/config";
import type {
  Office,
  PublicOfficeRequestStatus,
} from "@/lib/office-requests/types";

type BookingRequestFormProps = {
  offices: Office[];
  locale: Locale;
  mode: "booking" | "complaint";
};

type StoredRequest = PublicOfficeRequestStatus & {
  phone: string;
};

const initialState: BookingFormState = {
  ok: false,
  message: "",
};

const STORAGE_KEY = "cairo-office-requests:v1";

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
  locale,
  mode,
}: BookingRequestFormProps) {
  const [state, action, pending] = useActionState(
    submitOfficeRequest,
    initialState,
  );
  const savedRequestId = useRef<string | null>(null);
  const officeRef = useRef<HTMLSelectElement>(null);
  const travelerCategoryRef = useRef<HTMLSelectElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const preferredDateRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLTextAreaElement>(null);

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
      travelerCategory: travelerCategoryRef,
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

  return (
    <form action={action} className="space-y-0">
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
              {mode === "booking" ? "بيانات الحجز" : "بيانات الشكوى"}
            </h2>
            <p className="mt-1 text-sm text-gov-gray-600">
              {mode === "booking"
                ? "اختار المكتب ونوع المسافر والتاريخ المطلوب."
                : "الشكوى أو المقترح يذهب للمكتب الذي تختاره فقط."}
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
          {state.ok && state.request ? (
            <div className="mt-3 rounded-md bg-white/70 p-3 text-gov-navy">
              <p>
                رقم الطلب:{" "}
                <span className="font-extrabold">#{state.request.id}</span>
              </p>
              <LocaleLink
                locale={locale}
                href="/my-requests"
                className="mt-2 inline-flex min-h-10 items-center rounded-md bg-gov-accent px-4 text-sm font-bold text-white transition hover:bg-gov-navy"
              >
                متابعة طلباتي
              </LocaleLink>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-6 px-5 py-5 md:px-7">
        {offices.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            لم يتم تحميل المكاتب بعد. تأكد من إعداد Firebase أو بيانات fallback.
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            اسم المكتب
            <select
              ref={officeRef}
              name="officeId"
              required
              className={inputClass}
              defaultValue={state.values?.officeId ?? ""}
              disabled={offices.length === 0}
            >
              <option value="" disabled>
                اختر المكتب
              </option>
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.nameAr}
                </option>
              ))}
            </select>
            <FieldError message={state.errors?.officeId} />
          </label>

          {mode === "booking" ? (
            <label className={labelClass}>
              نوع المسافر
              <select
                ref={travelerCategoryRef}
                name="travelerCategory"
                required
                className={inputClass}
                defaultValue={state.values?.travelerCategory ?? ""}
              >
                <option value="" disabled>
                  اختر نوع المسافر
                </option>
                <option value="international">مسافر دولي</option>
                <option value="hajj_umrah">مسافر حج وعمرة</option>
                <option value="citizen">مواطنين</option>
              </select>
              <FieldError message={state.errors?.travelerCategory} />
            </label>
          ) : (
            <label className={labelClass}>
              نوع المتابعة
              <select
                ref={typeRef}
                name="type"
                required
                className={inputClass}
                defaultValue={state.values?.type ?? "complaint"}
              >
                <option value="complaint">تقديم شكوى</option>
                <option value="proposal">تقديم مقترح</option>
              </select>
              <FieldError message={state.errors?.type} />
            </label>
          )}
        </div>

        {mode === "booking" ? (
          <label className={labelClass}>
            التاريخ المطلوب
            <input
              ref={preferredDateRef}
              name="preferredDate"
              type="date"
              required
              className={inputClass}
              defaultValue={state.values?.preferredDate ?? ""}
            />
            <FieldError message={state.errors?.preferredDate} />
          </label>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            الاسم
            <input
              ref={nameRef}
              name="name"
              required
              minLength={2}
              autoComplete="name"
              className={inputClass}
              placeholder="اكتب اسمك"
              defaultValue={state.values?.name ?? ""}
            />
            <FieldError message={state.errors?.name} />
          </label>

          <label className={labelClass}>
            رقم الهاتف
            <input
              ref={phoneRef}
              name="phone"
              required
              inputMode="tel"
              autoComplete="tel"
              className={inputClass}
              placeholder="مثال: 01012345678"
              defaultValue={state.values?.phone ?? ""}
            />
            <FieldError message={state.errors?.phone} />
          </label>
        </div>

        <label className={labelClass}>
          {mode === "booking" ? "ملاحظات إضافية" : "تفاصيل الشكوى أو المقترح"}
          <textarea
            ref={detailsRef}
            name="details"
            required={mode !== "booking"}
            minLength={mode === "booking" ? undefined : 5}
            rows={6}
            className={`${inputClass} resize-y leading-relaxed`}
            placeholder={
              mode === "booking"
                ? "اكتب أي ملاحظات خاصة بالموعد إن وجدت"
                : "اكتب تفاصيل الشكوى أو المقترح"
            }
            defaultValue={state.values?.details ?? ""}
          />
          <FieldError message={state.errors?.details} />
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-gov-gray-200 bg-gov-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-7">
        <p className="text-sm leading-relaxed text-gov-gray-600">
          {mode === "booking"
            ? "سيتم إرسال الحجز للمكتب المختار لمتابعته من لوحة التحكم."
            : "سيتم إرسال المتابعة للمكتب المختار لمراجعتها من لوحة التحكم."}
        </p>
        <button
          type="submit"
          disabled={pending || offices.length === 0}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-gov-accent px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-gov-navy disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "جاري الإرسال..."
            : mode === "booking"
              ? "إرسال الحجز"
              : "إرسال المتابعة"}
        </button>
      </div>
    </form>
  );
}
