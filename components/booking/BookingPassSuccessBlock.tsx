"use client";

import { useMemo } from "react";
import { RequestPassCardActions } from "@/components/booking/RequestPassCardActions";
import { bookingPassFormCopy } from "@/lib/i18n/booking-pass-copy";
import type { Locale } from "@/lib/i18n/config";
import type { PublicOfficeRequestStatus } from "@/lib/office-requests/types";

type BookingPassSuccessBlockProps = {
  locale: Locale;
  request: PublicOfficeRequestStatus & { passToken: string };
  /** From request `headers()` on the booking page server. */
  serverSiteOrigin: string;
};

export function BookingPassSuccessBlock({
  locale,
  request,
  serverSiteOrigin,
}: BookingPassSuccessBlockProps) {
  const c = bookingPassFormCopy[locale];

  const subtitle = useMemo(
    () =>
      request.type === "complaint" || request.type === "proposal"
        ? c.cardSubtitleComplaint
        : c.cardSubtitle,
    [request.type, c.cardSubtitle, c.cardSubtitleComplaint],
  );

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-white/15 bg-gradient-to-b from-gov-navy-deep/95 to-gov-navy p-5 text-white shadow-inner">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-white/70">
          {c.passSectionTitle}
        </p>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-white/90">
          {subtitle}
        </p>
      </div>

      <RequestPassCardActions
        locale={locale}
        request={request}
        serverSiteOrigin={serverSiteOrigin}
        variant="dark"
      />
    </div>
  );
}
