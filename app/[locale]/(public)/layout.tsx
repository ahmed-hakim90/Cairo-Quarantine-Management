import { HashAnchorScroll } from "@/components/navigation/HashAnchorScroll";
import { FloatingTextToSpeechButton } from "@/components/layout/FloatingTextToSpeechButton";
import { FloatingVaccinationBookingButton } from "@/components/layout/FloatingVaccinationBookingButton";
import { FloatingWhatsAppButton } from "@/components/layout/FloatingWhatsAppButton";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { notFound } from "next/navigation";

export default async function PublicLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const messages = getMessages(locale);

  return (
    <>
      <a
        href="#main-content"
        className="absolute start-4 top-0 z-[100] -translate-y-full rounded-md bg-gov-accent px-4 py-3 text-sm font-semibold text-white shadow-md transition-transform focus:translate-y-4"
      >
        {messages.skipLink}
      </a>
      <SiteHeader locale={locale} messages={messages} />
      <main id="main-content" className="flex-1">
        <HashAnchorScroll />
        {children}
      </main>
      <SiteFooter messages={messages} />
      <div className="fixed bottom-5 start-5 z-[60] flex flex-col items-center gap-3">
        <FloatingTextToSpeechButton locale={locale} labels={messages.tts} />
        <FloatingWhatsAppButton />
      </div>
      <FloatingVaccinationBookingButton
        label={messages.nav.bookVaccination}
        ariaLabel={messages.nav.bookVaccinationAria}
        locale={locale}
      />
      <ServiceWorkerRegistrar />
      <InstallPrompt pwa={messages.pwa} />
    </>
  );
}
