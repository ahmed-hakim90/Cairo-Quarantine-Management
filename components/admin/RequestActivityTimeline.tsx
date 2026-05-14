import type { AdminActivityLogEntry } from "@/lib/office-requests/types";

type RequestActivityTimelineProps = {
  entries: AdminActivityLogEntry[];
};

export function RequestActivityTimeline({
  entries,
}: RequestActivityTimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="mt-2 text-sm text-gov-gray-600">
        لا توجد أحداث مسجّلة لهذا الطلب بعد.
      </p>
    );
  }

  return (
    <ol className="mt-3 space-y-4 border-s-2 border-gov-accent/35 ps-5">
      {entries.map((e) => (
        <li key={e.id} className="relative">
          <span
            className="absolute -start-2.5 top-1.5 h-2.5 w-2.5 rounded-full bg-gov-accent ring-2 ring-white"
            aria-hidden
          />
          <p className="text-sm font-bold text-gov-navy">{e.summaryAr}</p>
          <p className="mt-0.5 text-xs text-gov-gray-600">
            {e.actorLabel} — {new Date(e.createdAt).toLocaleString("ar-EG")}
          </p>
        </li>
      ))}
    </ol>
  );
}
