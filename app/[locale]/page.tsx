import { HeroSection } from "@/components/home/HeroSection";
import { ImportantLinks } from "@/components/home/ImportantLinks";
import { LocationsSection } from "@/components/home/LocationsSection";
import { ServiceCards } from "@/components/home/ServiceCards";
import { VaccineSelector } from "@/components/home/VaccineSelector";
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
      <ServiceCards locale={locale} content={m.services} />
      <VaccineSelector locale={locale} labels={m.vaccineSelector} />
      <ImportantLinks locale={locale} content={m.importantLinks} />
      <LocationsSection locale={locale} content={m.locations} />
    </>
  );
}
