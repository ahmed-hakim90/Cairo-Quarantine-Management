import { notFound, redirect } from "next/navigation";
import { PlatformInsightsPanel } from "@/components/admin/PlatformInsightsPanel";
import { buildPlatformInsightsSnapshot } from "@/lib/analytics/public-analytics-store";
import { getCairoTodayYmd, getCairoYmdDaysAgo } from "@/lib/cairo-today-ymd";
import { isLocale } from "@/lib/i18n/config";
import { getAdminSession } from "@/lib/office-requests/session";

export const dynamic = "force-dynamic";

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  const first = value?.[0];
  return typeof first === "string" ? first.trim() || undefined : undefined;
}

export default async function PlatformInsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);
  if (session.profile.role !== "super_admin") {
    redirect(`/${locale}/admin`);
  }

  const sp = (await searchParams) ?? {};
  const today = getCairoTodayYmd();
  const fromYmd = firstSearchParam(sp.from) ?? getCairoYmdDaysAgo(6);
  const toYmd = firstSearchParam(sp.to) ?? today;

  const snapshot = await buildPlatformInsightsSnapshot({ fromYmd, toYmd });

  return (
    <PlatformInsightsPanel
      locale={locale}
      fromYmd={fromYmd}
      toYmd={toYmd}
      snapshot={snapshot}
    />
  );
}
