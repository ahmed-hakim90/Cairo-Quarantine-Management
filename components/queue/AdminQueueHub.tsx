import Link from "next/link";
import type { Office } from "@/lib/office-requests/types";
import type { DailyStats } from "@/lib/queue/types";

export type OfficeQueueHubItem = {
  office: Office;
  stats: DailyStats;
};

type AdminQueueHubProps = {
  locale: string;
  queueDate: string;
  items: OfficeQueueHubItem[];
};

export function AdminQueueHub({ locale, queueDate, items }: AdminQueueHubProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-gov-gray-200 bg-white px-6 py-10 text-center text-sm text-gov-gray-600">
        لا توجد مكاتب متاحة ضمن صلاحياتك.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(({ office, stats }) => {
        const noShow = Math.max(0, stats.totalCheckedIn - stats.totalCompleted);
        const queueHref = `/${locale}/office-dashboard/${office.id}/queue`;

        return (
          <article
            key={office.id}
            className="flex flex-col rounded-lg border border-gov-gray-200 bg-white shadow-sm"
          >
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-heading text-lg font-extrabold text-gov-navy">
                    {office.nameAr}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-gov-gray-600">
                    {office.addressAr}
                  </p>
                </div>
                {office.active ? (
                  <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-800 ring-1 ring-emerald-100">
                    نشط
                  </span>
                ) : (
                  <span className="shrink-0 rounded-md bg-gov-gray-100 px-2 py-1 text-xs font-extrabold text-gov-gray-700">
                    معطّل
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs text-gov-gray-500">{queueDate}</p>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Stat label="حضر" value={stats.totalCheckedIn} />
                <Stat label="تم" value={stats.totalCompleted} />
                <Stat label="لم يكتمل" value={noShow} />
                <Stat label="آخر رقم" value={stats.lastQueueNumber} />
              </dl>

              {stats.closed ? (
                <p className="mt-3 text-xs font-bold text-amber-800">
                  الطابور مغلق لهذا اليوم
                </p>
              ) : null}
            </div>

            <div className="border-t border-gov-gray-100 p-4">
              <Link
                href={queueHref}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-gov-accent px-4 text-sm font-bold text-white transition hover:bg-gov-navy"
              >
                فتح الطابور
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-gov-gray-100 bg-gov-gray-50/80 px-3 py-2">
      <dt className="text-xs text-gov-gray-600">{label}</dt>
      <dd className="mt-0.5 text-lg font-extrabold text-gov-navy">{value}</dd>
    </div>
  );
}
