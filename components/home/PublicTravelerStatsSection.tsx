import type { PublicTravelerStats } from "@/lib/office-requests/public-stats";
import type { Locale } from "@/lib/i18n/config";

const copy = {
  ar: {
    title: "إحصاءات الخدمة",
    total: "طلبات آخر ٣٠ يوماً",
    completed: "حجوزات مكتملة",
    offices: "مكاتب نشطة",
  },
  en: {
    title: "Service statistics",
    total: "Requests (last 30 days)",
    completed: "Completed bookings",
    offices: "Active offices",
  },
  zh: {
    title: "服务统计",
    total: "近30天申请",
    completed: "已完成预约",
    offices: "活跃办公室",
  },
  fr: {
    title: "Statistiques du service",
    total: "Demandes (30 derniers jours)",
    completed: "Reservations terminees",
    offices: "Bureaux actifs",
  },
} satisfies Record<Locale, Record<string, string>>;

type Props = {
  locale: Locale;
  stats: PublicTravelerStats;
};

export function PublicTravelerStatsSection({ locale, stats }: Props) {
  const t = copy[locale];
  const intlLocale =
    locale === "ar"
      ? "ar-EG"
      : locale === "zh"
        ? "zh-CN"
        : locale === "fr"
          ? "fr-FR"
          : "en";

  const cards = [
    { label: t.total, value: stats.totalRequestsLast30Days },
    { label: t.completed, value: stats.completedBookingsLast30Days },
    { label: t.offices, value: stats.activeOffices },
  ];

  return (
    <section className="border-y border-gov-gray-200 bg-gov-accent-muted/30 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-heading text-2xl font-extrabold text-gov-navy">
          {t.title}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-bold text-gov-gray-600">{card.label}</p>
              <p className="mt-2 font-heading text-3xl font-extrabold text-gov-navy tabular-nums">
                {card.value.toLocaleString(intlLocale)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
