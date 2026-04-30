import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { FloatingWhatsAppButton } from "@/components/layout/FloatingWhatsAppButton";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import {
  isLocale,
  locales,
  type Locale,
} from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

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
  const messages = getMessages(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const lang = locale === "ar" ? "ar" : "en";

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${cairo.variable} ${tajawal.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground antialiased">
        <a
          href="#main-content"
          className="absolute start-4 top-0 z-[100] -translate-y-full rounded-md bg-gov-accent px-4 py-3 text-sm font-semibold text-white shadow-md transition-transform focus:translate-y-4"
        >
          {messages.skipLink}
        </a>
        <SiteHeader locale={locale} messages={messages} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter messages={messages} />
        <FloatingWhatsAppButton />
      </body>
    </html>
  );
}
