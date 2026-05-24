import { PublicAnalyticsShell } from "@/components/analytics/PublicAnalyticsShell";
import { HashAnchorScroll } from "@/components/navigation/HashAnchorScroll";
import { ConditionalSiteFooter } from "@/components/layout/ConditionalSiteFooter";
import { PublicFloatingChrome } from "@/components/layout/PublicFloatingChrome";
import { PublicMainContent } from "@/components/layout/PublicMainContent";
import { PublicBottomNav } from "@/components/layout/PublicBottomNav";
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
        className="absolute start-4 top-0 z-[100] -translate-y-full rounded-md bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-md transition-transform focus:translate-y-4"
      >
        {messages.skipLink}
      </a>
      <SiteHeader locale={locale} messages={messages} />
      <PublicMainContent>
        <PublicAnalyticsShell>
          <HashAnchorScroll />
          {children}
        </PublicAnalyticsShell>
      </PublicMainContent>
      <ConditionalSiteFooter messages={messages} />
      <PublicBottomNav locale={locale} messages={messages} />
      <PublicFloatingChrome locale={locale} messages={messages} />
      <ServiceWorkerRegistrar />
      <InstallPrompt pwa={messages.pwa} />
    </>
  );
}
