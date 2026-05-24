import { GeneralHealthTipsGrid } from "@/components/health-guide/GeneralHealthTipsGrid";
import { HajjTravelerOfficesTable } from "@/components/hajj/HajjTravelerOfficesTable";
import { HeroSection } from "@/components/home/HeroSection";
import { ImportantLinks } from "@/components/home/ImportantLinks";
import { ServiceCards } from "@/components/home/ServiceCards";
import { VaccineSelector } from "@/components/home/VaccineSelector";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
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
  const [vaccinesByCategory, offices] = await Promise.all([
    listVaccinesByCategoryForPublic(),
    listOffices(),
  ]);

  return (
    <>
      <HeroSection
        locale={locale}
        content={m.hero}
        bookingLabel={m.nav.bookVaccination}
        bookingAriaLabel={m.nav.bookVaccinationAria}
      />
      <ScrollReveal initialVisible>
        <ServiceCards locale={locale} content={m.services} />
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
