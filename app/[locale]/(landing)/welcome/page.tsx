import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getPublicLandingStats } from "@/lib/office-requests/public-stats";
import {
  listOffices,
  listVaccinesByCategoryForPublic,
} from "@/lib/office-requests/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return {
    title: m.landing.metaTitle,
    description: m.landing.metaDescription,
  };
}

function countPublicVaccines(
  byCategory: Awaited<ReturnType<typeof listVaccinesByCategoryForPublic>>,
): number {
  return Object.values(byCategory).reduce((sum, list) => sum + list.length, 0);
}

export default async function WelcomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const copy = getMessages(locale).landing;

  const [offices, landingStats, vaccinesByCategory] = await Promise.all([
    listOffices(),
    getPublicLandingStats(),
    listVaccinesByCategoryForPublic(),
  ]);

  const serviceCount = countPublicVaccines(vaccinesByCategory);
  const stats = {
    offices: landingStats.activeOffices,
    services: serviceCount > 0 ? serviceCount : 6,
    dailyRequests: landingStats.dailyRequests,
    users: copy.stats.usersValue,
  };

  return (
    <LandingPage
      locale={locale}
      copy={copy}
      offices={offices}
      stats={stats}
    />
  );
}
