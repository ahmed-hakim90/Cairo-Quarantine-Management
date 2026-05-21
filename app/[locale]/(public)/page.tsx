import { GeneralHealthTipsGrid } from "@/components/health-guide/GeneralHealthTipsGrid";
import { HajjTravelerOfficesTable } from "@/components/hajj/HajjTravelerOfficesTable";
import { HeroSection } from "@/components/home/HeroSection";
import { PublicTravelerStatsSection } from "@/components/home/PublicTravelerStatsSection";
import { ImportantLinks } from "@/components/home/ImportantLinks";
import { ServiceCards } from "@/components/home/ServiceCards";
import { VaccineSelector } from "@/components/home/VaccineSelector";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getPublicTravelerStats } from "@/lib/office-requests/public-stats";
import {
  listOffices,
  listVaccinesByCategoryForPublic,
} from "@/lib/office-requests/store";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const m = getMessages(locale);
  const [vaccinesByCategory, offices, travelerStats] = await Promise.all([
    listVaccinesByCategoryForPublic(),
    listOffices(),
    getPublicTravelerStats(),
  ]);

  return (
    <>
      <HeroSection content={m.hero} />
      <ScrollReveal initialVisible>
        <ServiceCards locale={locale} content={m.services} />
      </ScrollReveal>
      <ScrollReveal initialVisible>
        <PublicTravelerStatsSection locale={locale} stats={travelerStats} />
      </ScrollReveal>
      <ScrollReveal initialVisible>
        <GeneralHealthTipsGrid content={m.healthGuides.generalTips} />
      </ScrollReveal>
      <ScrollReveal>
        <VaccineSelector
          vaccinesByCategory={vaccinesByCategory}
          locale={locale}
          labels={m.vaccineSelector}
          bookingNav={{
            label: m.nav.bookVaccination,
            ariaLabel: m.nav.bookVaccinationAria,
          }}
        />
      </ScrollReveal>
      <ScrollReveal>
        <ImportantLinks content={m.importantLinks} />
      </ScrollReveal>
      <ScrollReveal>
        <HajjTravelerOfficesTable
          content={m.hajjTable}
          locale={locale}
          offices={offices}
        />
      </ScrollReveal>
    </>
  );
}
