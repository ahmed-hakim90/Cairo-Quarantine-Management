"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import type { PlatformInsightsSnapshot } from "@/lib/analytics/public-analytics-types";
import { BRAND_PRIMARY_DEEP } from "@/lib/theme/brand-colors";

type PlatformInsightsPanelProps = {
  locale: string;
  fromYmd: string;
  toYmd: string;
  snapshot: PlatformInsightsSnapshot;
};

type HealthState = {
  ok: boolean;
  configured: boolean;
  readOk: boolean;
  writeOk: boolean;
  checkedAt: string;
} | null;

function formatRelativeMinutes(isoDate: string): string {
  const ms = Date.now() - Date.parse(isoDate);
  if (!Number.isFinite(ms)) return "—";
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 1) return "الآن";
  if (minutes === 1) return "منذ دقيقة";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "منذ ساعة" : `منذ ${hours} ساعة`;
}

function formTypeLabelAr(formType?: string): string {
  if (formType === "booking") return "حجز";
  if (formType === "complaint") return "شكوى";
  if (formType === "checkin") return "حضور";
  return "—";
}

export function PlatformInsightsPanel({
  locale,
  fromYmd,
  toYmd,
  snapshot,
}: PlatformInsightsPanelProps) {
  const [health, setHealth] = useState<HealthState>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/system-health", {
          credentials: "include",
          headers: { "X-CQM-Admin-Request": "1" },
        });
        if (!res.ok) return;
        const data = (await res.json()) as HealthState;
        if (!cancelled) setHealth(data);
      } catch {
        if (!cancelled) {
          setHealth({
            ok: false,
            configured: false,
            readOk: false,
            writeOk: false,
            checkedAt: new Date().toISOString(),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = snapshot.topPaths.map((row) => ({
    name: row.path.replace(/^\/[a-z]{2}/, "") || "/",
    count: row.count,
  }));

  const healthBadge =
    health?.ok === true
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : health?.ok === false
        ? "border-red-200 bg-red-50 text-red-900"
        : "border-gov-gray-200 bg-gov-gray-50 text-gov-gray-700";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gov-navy">رؤية المنصة</h1>
            <p className="mt-2 text-sm text-gov-gray-600">
              تتبّع زوار الموقع والمواطنين — جلسات نشطة، زيارات، نماذج متروكة
              وأخطاء الإرسال.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${healthBadge}`}
            >
              {health?.ok
                ? "قاعدة البيانات: متصلة"
                : health?.ok === false
                  ? "قاعدة البيانات: مشكلة"
                  : "جاري فحص الاتصال…"}
            </span>
            <Link
              href={`/${locale}/admin/users`}
              className="inline-flex min-h-9 items-center rounded-md border border-gov-gray-300 px-3 text-xs font-bold text-gov-navy hover:bg-gov-gray-50"
            >
              إدارة المستخدمين
            </Link>
          </div>
        </div>

        <form
          method="get"
          className="mt-6 flex flex-col gap-4 rounded-md border border-gov-gray-100 bg-gov-gray-50/60 p-4 md:flex-row md:items-end"
        >
          <div className="flex min-w-[10rem] flex-col gap-1">
            <label htmlFor="insights-from" className="text-xs font-bold text-gov-gray-600">
              من
            </label>
            <input
              id="insights-from"
              name="from"
              type="date"
              defaultValue={fromYmd}
              className="rounded-md border border-gov-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex min-w-[10rem] flex-col gap-1">
            <label htmlFor="insights-to" className="text-xs font-bold text-gov-gray-600">
              إلى
            </label>
            <input
              id="insights-to"
              name="to"
              type="date"
              defaultValue={toYmd}
              className="rounded-md border border-gov-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-gov-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-gov-navy"
          >
            تطبيق
          </button>
        </form>
      </div>

      <section aria-labelledby="live-heading">
        <h2 id="live-heading" className="mb-3 text-lg font-extrabold text-gov-navy">
          الآن — {snapshot.activeCount} زائر نشط
        </h2>
        <p className="mb-4 text-xs text-gov-gray-600">
          نشط = heartbeat خلال آخر 3 دقائق
        </p>
        <div className="overflow-x-auto rounded-lg border border-gov-gray-200 bg-white shadow-sm">
          {snapshot.activeSessions.length === 0 ? (
            <p className="p-6 text-sm text-gov-gray-600">لا يوجد زوار نشطون حالياً.</p>
          ) : (
            <table className="min-w-full divide-y divide-gov-gray-200 text-sm">
              <thead className="bg-gov-gray-50">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-bold text-gov-gray-600">
                    آخر صفحة
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-bold text-gov-gray-600">
                    اللغة
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-bold text-gov-gray-600">
                    آخر نشاط
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-bold text-gov-gray-600">
                    نموذج مفتوح
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-gray-100">
                {snapshot.activeSessions.map((session) => (
                  <tr key={session.sessionId} className="hover:bg-gov-gray-50/80">
                    <td className="max-w-xs truncate px-4 py-3 font-medium text-gov-navy">
                      {session.lastPath}
                    </td>
                    <td className="px-4 py-3 text-gov-gray-700">{session.locale}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gov-gray-700">
                      {formatRelativeMinutes(session.lastSeenAt)}
                    </td>
                    <td className="px-4 py-3 text-gov-gray-800">
                      {session.formActive
                        ? `${formTypeLabelAr(session.formType)}${session.lastFormStep ? ` — ${session.lastFormStep}` : ""}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="mb-3 text-lg font-extrabold text-gov-navy">
          إحصائيات الفترة
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            label="زوار فريدون (الفترة)"
            value={snapshot.rangeStats.uniqueSessions}
          />
          <AdminStatCard
            label="صفحات فريدة (الفترة)"
            value={snapshot.rangeStats.pageViews}
          />
          <AdminStatCard
            label="متوسط وقت الجلسة (ث)"
            value={snapshot.rangeStats.avgSessionSeconds}
          />
          <AdminStatCard
            label="زوار اليوم"
            value={snapshot.todayStats.uniqueSessions}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard label="بدء نماذج" value={snapshot.rangeStats.formStarts} />
          <AdminStatCard label="إرسال ناجح" value={snapshot.rangeStats.formSubmits} />
          <AdminStatCard
            label="نماذج متروكة"
            value={snapshot.rangeStats.formAbandonments}
          />
          <AdminStatCard label="أخطاء إرسال" value={snapshot.rangeStats.formErrors} />
        </div>
      </section>

      {chartData.length > 0 ? (
        <section className="rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm">
          <h3 className="font-heading text-sm font-extrabold text-gov-navy">
            أكثر الصفحات (زيارة فريدة لكل زائر/يوم)
          </h3>
          <div className="mt-4 h-64 w-full min-w-0" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gov-gray-200" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={72}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
                <Tooltip
                  contentStyle={{ direction: "rtl", textAlign: "right" }}
                  formatter={(value) => [
                    typeof value === "number" ? value : Number(value) || 0,
                    "زيارة",
                  ]}
                />
                <Bar
                  dataKey="count"
                  name="زيارة"
                  fill={BRAND_PRIMARY_DEEP}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="problems-heading">
        <h2 id="problems-heading" className="mb-3 text-lg font-extrabold text-gov-navy">
          مشاكل المواطنين
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-x-auto rounded-lg border border-gov-gray-200 bg-white shadow-sm">
            <h3 className="border-b border-gov-gray-100 px-4 py-3 text-sm font-extrabold text-gov-navy">
              نماذج لم تُرسَل
            </h3>
            {snapshot.abandonedSessions.length === 0 ? (
              <p className="p-4 text-sm text-gov-gray-600">لا توجد جلسات بنماذج مفتوحة.</p>
            ) : (
              <table className="min-w-full divide-y divide-gov-gray-200 text-sm">
                <thead className="bg-gov-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-start text-xs font-bold text-gov-gray-600">
                      النوع
                    </th>
                    <th className="px-3 py-2 text-start text-xs font-bold text-gov-gray-600">
                      آخر خطوة
                    </th>
                    <th className="px-3 py-2 text-start text-xs font-bold text-gov-gray-600">
                      هاتف
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-gray-100">
                  {snapshot.abandonedSessions.map((session) => (
                    <tr key={session.sessionId}>
                      <td className="px-3 py-2">{formTypeLabelAr(session.formType)}</td>
                      <td className="px-3 py-2 text-gov-gray-700">
                        {session.lastFormStep ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-gov-gray-700">
                        {session.maskedPhone ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-gov-gray-200 bg-white shadow-sm">
            <h3 className="border-b border-gov-gray-100 px-4 py-3 text-sm font-extrabold text-gov-navy">
              أخطاء إرسال / اتصال
            </h3>
            {snapshot.problemEvents.length === 0 ? (
              <p className="p-4 text-sm text-gov-gray-600">لا توجد أحداث مشاكل حديثة.</p>
            ) : (
              <ul className="divide-y divide-gov-gray-100">
                {snapshot.problemEvents.map((event) => {
                  const requestId =
                    typeof event.meta?.requestId === "string"
                      ? event.meta.requestId
                      : null;
                  return (
                    <li key={event.id} className="px-4 py-3 text-sm">
                      <p className="font-semibold text-gov-navy">{event.summaryAr}</p>
                      <p className="mt-1 text-xs text-gov-gray-600">
                        {new Date(event.createdAt).toLocaleString("ar-EG")} — {event.path}
                      </p>
                      {requestId ? (
                        <Link
                          href={`/${locale}/admin/requests/${requestId}`}
                          className="mt-2 inline-flex text-xs font-bold text-gov-accent hover:underline"
                        >
                          فتح الطلب
                        </Link>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
