import { PublicBottomNav } from "@/components/layout/PublicBottomNav";
import { PUBLIC_MAIN_BOTTOM_PAD_CLASS } from "@/lib/layout/public-chrome";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingTopBar } from "@/components/landing/LandingTopBar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { notFound } from "next/navigation";

export default async function LandingLayout({
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
        className="absolute start-4 top-0 z-[100] -translate-y-full rounded-md bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-md transition-transform focus:translate-y-4"
      >
        {messages.skipLink}
      </a>
      <LandingTopBar locale={locale} messages={messages} />
      <main
        id="main-content"
        className={`flex-1 ${PUBLIC_MAIN_BOTTOM_PAD_CLASS} pt-[calc(3.75rem+env(safe-area-inset-top,0px))] md:pb-0`}
      >
        {children}
      </main>
      <LandingFooter locale={locale} messages={messages} />
      <PublicBottomNav locale={locale} messages={messages} />
      <ServiceWorkerRegistrar />
      <InstallPrompt pwa={messages.pwa} />
    </>
  );
}
