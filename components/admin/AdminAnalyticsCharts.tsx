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
import type {
  AdminBookingQueueSection,
  AdminFeedbackSection,
  AdminRequestAnalytics,
} from "@/lib/office-requests/analytics";
import { REQUEST_TYPE_LABELS } from "@/lib/office-requests/types";
import {
  BRAND_PRIMARY,
  BRAND_PRIMARY_DEEP,
  BRAND_SECONDARY,
} from "@/lib/theme/brand-colors";

type AdminAnalyticsChartsProps = {
  analytics: AdminRequestAnalytics;
  bookingQueue: AdminBookingQueueSection;
  feedback: AdminFeedbackSection;
  showFeedback?: boolean;
};

export function AdminAnalyticsCharts({
  analytics,
  bookingQueue,
  feedback,
  showFeedback = true,
}: AdminAnalyticsChartsProps) {
  const queueData = [
    { name: "حضر", count: bookingQueue.checkedIn },
    { name: "انتهاء فعلي", count: bookingQueue.completed },
    { name: "لم يُكمَّل", count: bookingQueue.notCompleted },
  ];

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
          الحجوزات — حضور وإنهاء
        </h3>
        <p className="mt-1 text-xs text-gov-gray-600">
          ضمن النطاق المفلتر؛ «لم يُكمَّل» = حضر الطابور ولم يُنهَ عند المكتب.
        </p>
        <div className="mt-4 h-64 w-full min-w-0" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={queueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gov-gray-200" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={56} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
              <Tooltip
                contentStyle={{ direction: "rtl", textAlign: "right" }}
                formatter={(value) => [
                  typeof value === "number" ? value : Number(value) || 0,
                  "العدد",
                ]}
              />
              <Bar dataKey="count" name="العدد" fill={BRAND_PRIMARY_DEEP} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {showFeedback ? (
        <div className={chartCardClass}>
          <h3 className="font-heading text-sm font-extrabold text-gov-navy">
            الطلبات حسب النوع
          </h3>
          <p className="mt-1 text-xs text-gov-gray-600">
            الشكاوى والمقترحات الجديدة: {feedback.newCount} من {feedback.total}.
          </p>
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
                <Bar dataKey="count" name="العدد" fill={BRAND_PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

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
              <Bar dataKey="count" name="عدد الطلبات" fill={BRAND_SECONDARY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
