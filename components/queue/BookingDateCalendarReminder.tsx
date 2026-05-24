"use client";

import { useMemo } from "react";
import {
  buildGoogleCalendarReminderUrl,
  downloadBookingReminderIcs,
} from "@/lib/booking-calendar-reminder";
import { buildOfficeCheckinUrl } from "@/lib/booking-pass-url";
import { checkinBookingCopy } from "@/lib/i18n/checkin-copy";
import type { Locale } from "@/lib/i18n/config";

type CalendarReminderVariant = "amber" | "dark" | "light";

type BookingDateCalendarReminderProps = {
  locale: Locale;
  requestId: string;
  preferredDate: string;
  officeNameAr: string;
  officeId: string;
  variant?: CalendarReminderVariant;
  serverSiteOrigin?: string;
};

function formatTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, value),
    template,
  );
}

const variantStyles = {
  amber: {
    wrapper: "mt-4 space-y-3 border-t border-amber-200/80 pt-4",
    hint: "text-center text-xs font-semibold leading-relaxed text-amber-900/90",
    primaryBtn:
      "inline-flex min-h-10 items-center justify-center rounded-md bg-gov-accent px-4 text-sm font-bold text-white transition hover:bg-gov-navy",
    secondaryBtn:
      "inline-flex min-h-10 items-center justify-center rounded-md border border-amber-300 bg-white px-4 text-sm font-bold text-gov-navy transition hover:bg-amber-50",
  },
  dark: {
    wrapper: "space-y-3 border-t border-white/20 pt-4",
    hint: "text-center text-xs font-semibold leading-relaxed text-white/75",
    primaryBtn:
      "inline-flex min-h-10 items-center justify-center rounded-md border border-white/30 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20",
    secondaryBtn:
      "inline-flex min-h-10 items-center justify-center rounded-md border border-emerald-300/40 bg-emerald-500/20 px-4 text-sm font-bold text-emerald-50 transition hover:bg-emerald-500/30",
  },
  light: {
    wrapper: "space-y-3 border-t border-gov-gray-200 pt-4",
    hint: "text-center text-xs font-semibold leading-relaxed text-gov-gray-600",
    primaryBtn:
      "inline-flex min-h-10 items-center justify-center rounded-md bg-gov-accent px-4 text-sm font-bold text-white transition hover:bg-gov-navy",
    secondaryBtn:
      "inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-200 bg-white px-4 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50",
  },
} satisfies Record<
  CalendarReminderVariant,
  { wrapper: string; hint: string; primaryBtn: string; secondaryBtn: string }
>;

export function BookingDateCalendarReminder({
  locale,
  requestId,
  preferredDate,
  officeNameAr,
  officeId,
  variant = "amber",
  serverSiteOrigin = "",
}: BookingDateCalendarReminderProps) {
  const t = checkinBookingCopy[locale];
  const styles = variantStyles[variant];

  const calendarInput = useMemo(() => {
    const origin =
      serverSiteOrigin.replace(/\/+$/, "") ||
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const checkinLink = origin
      ? buildOfficeCheckinUrl(origin, locale, officeId, requestId)
      : "";

    const title = formatTemplate(t.calendarEventTitle, { office: officeNameAr });
    const description = formatTemplate(t.calendarEventDescription, {
      id: requestId,
      office: officeNameAr,
      date: preferredDate,
      checkinLink,
    });

    return { requestId, preferredDate, title, description };
  }, [
    locale,
    officeId,
    officeNameAr,
    preferredDate,
    requestId,
    serverSiteOrigin,
    t,
  ]);

  const googleUrl = useMemo(
    () => buildGoogleCalendarReminderUrl(calendarInput),
    [calendarInput],
  );

  if (!googleUrl) return null;

  return (
    <div className={styles.wrapper}>
      <p className={styles.hint}>{t.calendarHint}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => downloadBookingReminderIcs(calendarInput)}
          className={styles.primaryBtn}
        >
          {t.downloadCalendar}
        </button>
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.secondaryBtn}
        >
          {t.googleCalendar}
        </a>
      </div>
    </div>
  );
}
