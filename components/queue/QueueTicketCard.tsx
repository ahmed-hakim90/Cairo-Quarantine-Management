import type { QueueTicket } from "@/lib/queue/types";

type QueueTicketCardProps = {
  ticket: QueueTicket;
  officeNameAr: string;
  citizenName?: string;
};

const STATUS_LABELS = {
  waiting: "في الانتظار",
  completed: "تم الانتهاء",
} as const;

export function QueueTicketCard({
  ticket,
  officeNameAr,
  citizenName,
}: QueueTicketCardProps) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-gov-gray-200 bg-white p-6 text-center shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-gov-gray-600">
        رقم الدور
      </p>
      <p className="mt-2 font-heading text-6xl font-extrabold text-gov-accent">
        {ticket.queueNumber}
      </p>
      <dl className="mt-6 grid gap-3 text-sm text-start">
        {citizenName ? <InfoRow label="الاسم" value={citizenName} /> : null}
        <InfoRow label="رقم الطلب" value={ticket.requestNumber} />
        <InfoRow label="المكتب" value={officeNameAr} />
        <InfoRow label="تاريخ اليوم" value={ticket.queueDate} />
        <InfoRow
          label="الحالة"
          value={STATUS_LABELS[ticket.status]}
          valueClassName={
            ticket.status === "completed"
              ? "font-bold text-emerald-800"
              : "font-bold text-amber-800"
          }
        />
      </dl>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClassName = "font-bold text-gov-navy",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-md border border-gov-gray-100 bg-gov-gray-50/80 px-3 py-2">
      <dt className="text-xs text-gov-gray-600">{label}</dt>
      <dd className={`mt-0.5 ${valueClassName}`}>{value}</dd>
    </div>
  );
}
