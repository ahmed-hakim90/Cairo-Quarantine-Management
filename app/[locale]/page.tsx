import { HeroSection } from "@/components/home/HeroSection";
import { ImportantLinks } from "@/components/home/ImportantLinks";
import { LocationsSection } from "@/components/home/LocationsSection";
import { ServiceCards } from "@/components/home/ServiceCards";
import { TravelerStatsSection } from "@/components/home/TravelerStatsSection";
import { VaccineSelector } from "@/components/home/VaccineSelector";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const m = getMessages(locale);

  return (
    <>
      <HeroSection content={m.hero} />
      <ScrollReveal>
        <ServiceCards locale={locale} content={m.services} />
      </ScrollReveal>
      <ScrollReveal>
        <TravelerStatsSection
          locale={locale}
          content={m.travelerStats}
          serviceTitles={{
            internationalTitle: m.services.internationalTitle,
            hajjTitle: m.services.hajjTitle,
            citizenTitle: m.services.citizenTitle,
          }}
        />
      </ScrollReveal>
      <ScrollReveal>
        <VaccineSelector locale={locale} labels={m.vaccineSelector} />
      </ScrollReveal>
      <ScrollReveal>
        <ImportantLinks locale={locale} content={m.importantLinks} />
      </ScrollReveal>
      <ScrollReveal>
        <LocationsSection locale={locale} content={m.locations} />
      </ScrollReveal>
    </>
  );
}
