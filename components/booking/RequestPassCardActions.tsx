"use client";

import { useCallback } from "react";
import { BookingDateCalendarReminder } from "@/components/queue/BookingDateCalendarReminder";
import { downloadBookingPassPdf } from "@/lib/booking-pass-pdf";
import { useBookingPassUrl } from "@/lib/hooks/use-booking-pass-url";
import { bookingPassFormCopy } from "@/lib/i18n/booking-pass-copy";
import type { Locale } from "@/lib/i18n/config";
import type { PublicOfficeRequestStatus } from "@/lib/office-requests/types";

type RequestPassCardActionsProps = {
  locale: Locale;
  request: PublicOfficeRequestStatus & { passToken: string };
  serverSiteOrigin?: string;
  variant?: "dark" | "light";
};

export function RequestPassCardActions({
  locale,
  request,
  serverSiteOrigin = "",
  variant = "light",
}: RequestPassCardActionsProps) {
  const c = bookingPassFormCopy[locale];
  const isBooking = request.type === "booking";
  const showCalendar =
    isBooking &&
    Boolean(request.preferredDate?.trim()) &&
    Boolean(request.officeId?.trim());
  const isDark = variant === "dark";

  const { passUrl, queueUrl } = useBookingPassUrl({
    locale,
    requestId: request.id,
    passToken: request.passToken,
    officeId: request.officeId,
    serverSiteOrigin,
  });

  const downloadPdf = useCallback(async () => {
    if (!passUrl) return;
    await downloadBookingPassPdf({
      locale,
      requestId: request.id,
      requestType: request.type,
      officeNameAr: request.officeNameAr,
      preferredDate: request.preferredDate,
      passUrl,
      queueUrl: isBooking ? queueUrl : undefined,
    });
  }, [
    passUrl,
    queueUrl,
    locale,
    request.id,
    request.type,
    request.officeNameAr,
    request.preferredDate,
    isBooking,
  ]);

  const openTracking = useCallback(() => {
    if (!passUrl) return;
    window.open(passUrl, "_blank", "noopener,noreferrer");
  }, [passUrl]);

  const primaryBtn = isDark
    ? "inline-flex min-h-10 items-center justify-center rounded-md bg-gov-accent px-4 text-sm font-bold text-white shadow transition hover:bg-gov-navy disabled:cursor-not-allowed disabled:opacity-50"
    : "inline-flex min-h-10 items-center justify-center rounded-md bg-gov-accent px-4 text-sm font-bold text-white transition hover:bg-gov-navy disabled:cursor-not-allowed disabled:opacity-50";

  const secondaryBtn = isDark
    ? "inline-flex min-h-10 items-center justify-center rounded-md border border-white/30 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
    : "inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-200 bg-white px-4 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

  const queueBtn = isDark
    ? "inline-flex min-h-10 items-center justify-center rounded-md border border-emerald-300/40 bg-emerald-500/20 px-4 text-sm font-bold text-emerald-50 transition hover:bg-emerald-500/30"
    : "inline-flex min-h-10 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-900 transition hover:bg-emerald-100";

  const noticeClass = isDark
    ? "rounded-md border border-amber-200/30 bg-amber-500/10 px-3 py-2 text-center text-xs font-semibold leading-relaxed text-amber-100"
    : "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-semibold leading-relaxed text-amber-900";

  return (
    <div className="space-y-3">
      <p className={noticeClass}>{c.keepCardNotice}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openTracking}
          disabled={!passUrl}
          className={primaryBtn}
        >
          {c.openTracking}
        </button>
        <button
          type="button"
          onClick={() => void downloadPdf()}
          disabled={!passUrl}
          className={secondaryBtn}
        >
          {c.downloadPdf}
        </button>
        {isBooking && queueUrl ? (
          <a href={queueUrl} target="_blank" rel="noopener noreferrer" className={queueBtn}>
            {c.queueLinkLabel}
          </a>
        ) : null}
      </div>
      {isBooking ? (
        <p
          className={
            isDark
              ? "text-center text-[11px] leading-relaxed text-white/60"
              : "text-xs leading-relaxed text-gov-gray-600"
          }
        >
          {c.queueSameDayNote}
        </p>
      ) : null}
      {showCalendar && request.officeId && request.preferredDate ? (
        <BookingDateCalendarReminder
          locale={locale}
          requestId={request.id}
          preferredDate={request.preferredDate}
          officeNameAr={request.officeNameAr}
          officeId={request.officeId}
          variant={isDark ? "dark" : "light"}
          serverSiteOrigin={serverSiteOrigin}
        />
      ) : null}
    </div>
  );
}
