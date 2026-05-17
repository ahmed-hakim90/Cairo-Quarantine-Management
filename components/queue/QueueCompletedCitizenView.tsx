"use client";

import { BookingPassSuccessBlock } from "@/components/booking/BookingPassSuccessBlock";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { queueCitizenCopy } from "@/lib/i18n/queue-citizen-copy";
import type { Locale } from "@/lib/i18n/config";
import type { OfficeRequest } from "@/lib/office-requests/types";
import type { PublicOfficeRequestStatus } from "@/lib/office-requests/types";
import type { QueueTicket } from "@/lib/queue/types";

type QueueCompletedCitizenViewProps = {
  locale: Locale;
  ticket: QueueTicket;
  officeNameAr: string;
  citizenName?: string;
  passToken?: string;
  requestType?: OfficeRequest["type"];
  requestId?: string;
  requestOfficeNameAr?: string;
  preferredDate?: string;
  serverSiteOrigin: string;
};

export function QueueCompletedCitizenView({
  locale,
  ticket,
  officeNameAr,
  citizenName,
  passToken,
  requestType = "booking",
  requestId,
  requestOfficeNameAr,
  preferredDate,
  serverSiteOrigin,
}: QueueCompletedCitizenViewProps) {
  const t = queueCitizenCopy[locale];
  const displayRequestId = requestId ?? ticket.requestId;
  const displayOffice = requestOfficeNameAr ?? officeNameAr;

  const passRequest: (PublicOfficeRequestStatus & { passToken: string }) | null =
    passToken && displayRequestId
      ? {
          id: displayRequestId,
          requestNumber: ticket.requestNumber,
          officeNameAr: displayOffice,
          type: requestType,
          status: "completed",
          preferredDate,
          notes: "",
          createdAt: ticket.checkedInAt,
          updatedAt: ticket.completedAt ?? ticket.checkedInAt,
          passToken,
        }
      : null;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
          {t.completedTitle}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gov-gray-700">
          {t.completedBody}
        </p>
        <p className="mt-4 font-heading text-5xl font-extrabold text-gov-accent">
          {ticket.queueNumber}
        </p>
        <p className="mt-1 text-xs font-bold text-gov-gray-600">
          {t.queueNumberLabel}
        </p>
        <dl className="mt-6 grid gap-2 text-sm text-start">
          {citizenName ? (
            <Row label={t.nameLabel} value={citizenName} />
          ) : null}
          <Row label={t.requestNumberLabel} value={ticket.requestNumber} />
          <Row label={t.officeLabel} value={displayOffice} />
        </dl>
      </div>

      {passRequest ? (
        <BookingPassSuccessBlock
          locale={locale}
          request={passRequest}
          serverSiteOrigin={serverSiteOrigin}
        />
      ) : (
        <div className="rounded-xl border border-emerald-200/60 bg-gradient-to-b from-gov-navy-deep/95 to-gov-navy p-5 text-white shadow-inner">
          <p className="text-center text-sm leading-relaxed text-white/90">
            {t.saveRequestHint}
          </p>
          <p className="mt-3 text-center font-mono text-lg font-extrabold tracking-wide">
            #{displayRequestId}
          </p>
          <div className="mt-4 flex justify-center">
            <LocaleLink
              locale={locale}
              href="/my-requests"
              className="inline-flex min-h-10 items-center rounded-md bg-teal-500 px-4 text-sm font-bold text-white hover:bg-teal-400"
            >
              {t.myRequestsLink}
            </LocaleLink>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-md border border-gov-gray-100 bg-white px-3 py-2">
      <dt className="text-gov-gray-600">{label}</dt>
      <dd className="font-bold text-gov-navy">{value}</dd>
    </div>
  );
}
