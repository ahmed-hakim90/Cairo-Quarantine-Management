import type { Metadata, Viewport } from "next";
import { BRAND_PRIMARY } from "@/lib/theme/brand-colors";
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
import { BRAND_SURFACE } from "@/lib/theme/brand-colors";
import { SPLASH_SESSION_KEY } from "@/lib/splash/splash-session-storage";

function localeFontClassName(locale: Locale): string {
  return locale === "zh" ? "zh-site h-full" : arabicFontClassName();
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND_PRIMARY },
    { media: "(prefers-color-scheme: dark)", color: BRAND_PRIMARY },
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
      style={{ backgroundColor: BRAND_SURFACE }}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col bg-brand-surface text-foreground antialiased"
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(sessionStorage.getItem(${JSON.stringify(SPLASH_SESSION_KEY)})!=="1")document.documentElement.classList.add("cqm-splash-active")}catch(e){}})();`,
          }}
        />
        <SplashChrome
          platformTitle={messages.landing.hero.title}
          platformSubtitle={messages.landing.hero.subtitle}
          loadingLabel={messages.splash.loading}
          ariaLabel={messages.splash.ariaLabel}
          logoAlt={messages.landing.topBar.logoAlt}
        />
        <div id="cqm-app-root" className="flex min-h-full flex-1 flex-col">
          <FeedbackProvider>{children}</FeedbackProvider>
        </div>
      </body>
    </html>
  );
}
