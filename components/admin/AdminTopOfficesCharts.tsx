"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TopOfficeChartRow } from "@/lib/office-requests/analytics";
import {
  BRAND_PRIMARY_DEEP,
  BRAND_SECONDARY,
} from "@/lib/theme/brand-colors";

type AdminTopOfficesChartsProps = {
  topByRequests: TopOfficeChartRow[];
  topByComplaints: TopOfficeChartRow[];
  showComplaints?: boolean;
};

function TopOfficesBarChart({
  title,
  subtitle,
  data,
  barColor,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  data: TopOfficeChartRow[];
  barColor: string;
  emptyMessage: string;
}) {
  const chartData = data.map((row) => ({
    name: row.officeNameAr,
    count: row.count,
  }));
  const chartHeight = Math.max(220, chartData.length * 36 + 48);

  return (
    <div className="rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm">
      <h3 className="font-heading text-sm font-extrabold text-gov-navy">{title}</h3>
      <p className="mt-1 text-xs text-gov-gray-600">{subtitle}</p>
      {chartData.length === 0 ? (
        <p className="mt-6 rounded-md border border-gov-gray-100 bg-gov-gray-50 px-4 py-8 text-center text-sm text-gov-gray-600">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-4 w-full min-w-0" dir="ltr" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gov-gray-200" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={132}
                tick={{ fontSize: 10 }}
                interval={0}
              />
              <Tooltip
                contentStyle={{ direction: "rtl", textAlign: "right" }}
                formatter={(value) => [
                  typeof value === "number" ? value : Number(value) || 0,
                  "العدد",
                ]}
                labelFormatter={(label) => String(label)}
              />
              <Bar dataKey="count" name="العدد" radius={[0, 4, 4, 0]} barSize={22}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`${entry.name}-${index}`}
                    fill={index === 0 ? barColor : `${barColor}CC`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function AdminTopOfficesCharts({
  topByRequests,
  topByComplaints,
  showComplaints = true,
}: AdminTopOfficesChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TopOfficesBarChart
        title="أعلى 10 مكاتب بالطلبات"
        subtitle="ترتيب حسب إجمالي الطلبات (حجوزات + شكاوى + مقترحات) ضمن النطاق المفلتر."
        data={topByRequests}
        barColor={BRAND_PRIMARY_DEEP}
        emptyMessage="لا توجد طلبات مسجّلة للمكاتب في هذا النطاق."
      />
      {showComplaints ? (
        <TopOfficesBarChart
          title="أعلى 10 مكاتب بالشكاوى"
          subtitle="ترتيب حسب عدد الشكاوى فقط ضمن النطاق المفلتر."
          data={topByComplaints}
          barColor={BRAND_SECONDARY}
          emptyMessage="لا توجد شكاوى مسجّلة للمكاتب في هذا النطاق."
        />
      ) : null}
    </div>
  );
}
