"use client";

import { queueCitizenCopy } from "@/lib/i18n/queue-citizen-copy";
import type { Locale } from "@/lib/i18n/config";
import type { QueueTicket } from "@/lib/queue/types";

type QueueCompletedCitizenViewProps = {
  locale: Locale;
  ticket: QueueTicket;
  officeNameAr: string;
  citizenName?: string;
};

export function QueueCompletedCitizenView({
  locale,
  ticket,
  officeNameAr,
  citizenName,
}: QueueCompletedCitizenViewProps) {
  const t = queueCitizenCopy[locale];

  return (
    <div className="mx-auto max-w-md">
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
            <Row label={t.officeLabel} value={officeNameAr} />
          </dl>
        </div>
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
