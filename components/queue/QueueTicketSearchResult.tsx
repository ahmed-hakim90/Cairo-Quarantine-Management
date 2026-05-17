"use client";

import { QueueCompleteTicketForm } from "@/components/queue/QueueCompleteTicketForm";
import type { QueueCreatedFrom, QueueTicketWithRequest } from "@/lib/queue/types";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
} from "@/lib/office-requests/types";

const TICKET_STATUS_LABELS = {
  waiting: "في الانتظار",
  completed: "تم الانتهاء",
} as const;

const CREATED_FROM_LABELS: Record<QueueCreatedFrom, string> = {
  new_request: "تسجيل سريع عبر QR",
  existing_request: "طلب مسجّل مسبقاً",
};

type QueueTicketSearchResultProps = {
  locale: string;
  officeId: string;
  ticket: QueueTicketWithRequest;
  completeAction: (formData: FormData) => void;
  completePending: boolean;
};

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function QueueTicketSearchResult({
  locale,
  officeId,
  ticket,
  completeAction,
  completePending,
}: QueueTicketSearchResultProps) {
  const request = ticket.request;

  return (
    <section className="rounded-lg border border-gov-gray-200 bg-white shadow-sm">
      <div className="border-b border-gov-gray-100 px-5 py-4">
        <p className="text-xs font-bold uppercase text-gov-gray-600">
          نتيجة البحث
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-xl font-extrabold text-gov-navy">
            دور رقم {ticket.queueNumber}
          </h2>
          <span
            className={
              ticket.status === "completed"
                ? "rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800"
                : "rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900"
            }
          >
            {TICKET_STATUS_LABELS[ticket.status]}
          </span>
          <span className="rounded-md bg-gov-accent-muted px-2.5 py-1 text-xs font-bold text-gov-navy">
            {CREATED_FROM_LABELS[ticket.createdFrom]}
          </span>
        </div>
      </div>

      <div className="space-y-6 p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Detail label="رقم الطلب" value={ticket.requestNumber} mono />
          {request?.name ? <Detail label="الاسم" value={request.name} /> : null}
          {request?.phone ? (
            <Detail label="الهاتف" value={request.phone} mono dir="ltr" />
          ) : null}
          {request ? (
            <>
              <Detail
                label="نوع الطلب"
                value={REQUEST_TYPE_LABELS[request.type]}
              />
              <Detail
                label="حالة الطلب"
                value={REQUEST_STATUS_LABELS[request.status]}
              />
              {request.preferredDate ? (
                <Detail label="التاريخ المطلوب" value={request.preferredDate} />
              ) : null}
              <Detail
                label="تاريخ إنشاء الطلب"
                value={formatDateTime(request.createdAt)}
              />
            </>
          ) : null}
        </dl>

        {request?.details?.trim() ? (
          <div>
            <h3 className="text-sm font-bold text-gov-navy">تفاصيل الطلب</h3>
            <p className="mt-2 whitespace-pre-wrap rounded-md border border-gov-gray-200 bg-gov-gray-50 p-4 text-sm leading-relaxed text-gov-gray-700">
              {request.details}
            </p>
          </div>
        ) : null}

        {request?.notes?.trim() ? (
          <div>
            <h3 className="text-sm font-bold text-gov-navy">ملاحظات داخلية</h3>
            <p className="mt-2 whitespace-pre-wrap rounded-md border border-gov-gray-200 bg-gov-gray-50 p-4 text-sm leading-relaxed text-gov-gray-700">
              {request.notes}
            </p>
          </div>
        ) : null}

        {ticket.status === "waiting" ? (
          <QueueCompleteTicketForm
            locale={locale}
            officeId={officeId}
            ticketId={ticket.id}
            completeAction={completeAction}
            disabled={completePending}
          />
        ) : null}
      </div>
    </section>
  );
}

function Detail({
  label,
  value,
  mono,
  dir,
}: {
  label: string;
  value: string;
  mono?: boolean;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="rounded-md border border-gov-gray-100 bg-gov-gray-50/60 px-3 py-2.5">
      <dt className="text-xs font-bold text-gov-gray-600">{label}</dt>
      <dd
        className={`mt-1 font-bold text-gov-navy ${mono ? "font-mono text-xs" : ""}`}
        dir={dir}
      >
        {value}
      </dd>
    </div>
  );
}
