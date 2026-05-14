"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminRequestAnalytics } from "@/lib/office-requests/analytics";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
} from "@/lib/office-requests/types";

type AdminAnalyticsChartsProps = {
  analytics: AdminRequestAnalytics;
};

export function AdminAnalyticsCharts({ analytics }: AdminAnalyticsChartsProps) {
  const statusData = (
    Object.entries(analytics.byStatus) as [keyof typeof analytics.byStatus, number][]
  ).map(([key, count]) => ({
    name: REQUEST_STATUS_LABELS[key],
    count,
  }));

  const typeData = (
    Object.entries(analytics.byType) as [keyof typeof analytics.byType, number][]
  ).map(([key, count]) => ({
    name: REQUEST_TYPE_LABELS[key],
    count,
  }));

  const timelineData = analytics.timelineWeeks.map((w) => ({
    name: w.weekStart,
    count: w.count,
  }));

  const chartCardClass =
    "rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={chartCardClass}>
        <h3 className="font-heading text-sm font-extrabold text-gov-navy">
          الطلبات حسب الحالة
        </h3>
        <div className="mt-4 h-64 w-full min-w-0" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gov-gray-200" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
              <Tooltip
                contentStyle={{ direction: "rtl", textAlign: "right" }}
                formatter={(value) => [
                  typeof value === "number" ? value : Number(value) || 0,
                  "العدد",
                ]}
              />
              <Bar dataKey="count" name="العدد" fill="#0c2340" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={chartCardClass}>
        <h3 className="font-heading text-sm font-extrabold text-gov-navy">
          الطلبات حسب النوع
        </h3>
        <div className="mt-4 h-64 w-full min-w-0" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gov-gray-200" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
              <Tooltip
                contentStyle={{ direction: "rtl", textAlign: "right" }}
                formatter={(value) => [
                  typeof value === "number" ? value : Number(value) || 0,
                  "العدد",
                ]}
              />
              <Bar dataKey="count" name="العدد" fill="#1a5f7a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${chartCardClass} lg:col-span-2`}>
        <h3 className="font-heading text-sm font-extrabold text-gov-navy">
          الطلبات الجديدة أسبوعياً (آخر 90 يوماً)
        </h3>
        <p className="mt-1 text-xs text-gov-gray-600">
          المحور الأفقي يعرض بداية الأسبوع (UTC) حسب تاريخ إنشاء الطلب.
        </p>
        <div className="mt-4 h-72 w-full min-w-0" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gov-gray-200" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={56} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
              <Tooltip
                contentStyle={{ direction: "rtl", textAlign: "right" }}
                formatter={(value) => [
                  typeof value === "number" ? value : Number(value) || 0,
                  "طلبات",
                ]}
              />
              <Bar dataKey="count" name="عدد الطلبات" fill="#c5a572" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
