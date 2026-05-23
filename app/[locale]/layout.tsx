import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import {
  isLocale,
  locales,
  type Locale,
} from "@/lib/i18n/config";
import { SplashChrome } from "@/components/splash/SplashChrome";
import { FeedbackProvider } from "@/components/ui/FeedbackProvider";
import { getMessages } from "@/lib/i18n/messages";
import { arabicFontClassName } from "@/lib/fonts/arabic";

function localeFontClassName(locale: Locale): string {
  return locale === "zh" ? "zh-site h-full" : arabicFontClassName();
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B4A8B" },
    { media: "(prefers-color-scheme: dark)", color: "#0B4A8B" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return {
    title: {
      default: m.meta.siteName,
      template: `%s | ${m.meta.siteName}`,
    },
    description: m.meta.siteDescription,
    applicationName: m.meta.siteName,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: m.meta.siteName,
    },
    icons: {
      apple: [
        { url: "/icons/apple-touch-icon-180.png", sizes: "180x180" },
        { url: "/icons/apple-touch-icon-167.png", sizes: "167x167" },
        { url: "/icons/apple-touch-icon-152.png", sizes: "152x152" },
        { url: "/icons/apple-touch-icon-120.png", sizes: "120x120" },
      ],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const lang =
    locale === "ar"
      ? "ar"
      : locale === "zh"
        ? "zh-CN"
        : locale === "fr"
          ? "fr"
          : "en";
  const htmlClass = localeFontClassName(locale);
  const messages = getMessages(locale);

  return (
    <html
      lang={lang}
      dir={dir}
      className={htmlClass}
      style={{ backgroundColor: "#F5F9FD" }}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col bg-landing-bg text-foreground antialiased"
        suppressHydrationWarning
      >
        <SplashChrome
          platformTitle={messages.landing.hero.title}
          platformSubtitle={messages.landing.hero.subtitle}
          loadingLabel={messages.splash.loading}
          ariaLabel={messages.splash.ariaLabel}
          logoAlt={messages.landing.topBar.logoAlt}
        />
        <FeedbackProvider>{children}</FeedbackProvider>
      </body>
    </html>
  );
}
