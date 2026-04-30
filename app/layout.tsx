import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

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

export const metadata: Metadata = {
  title: {
    default: "إدارة الحجر الصحي بالقاهرة",
    template: "%s | إدارة الحجر الصحي بالقاهرة",
  },
  description:
    "البوابة الرسمية لخدمات الحجر الصحي والتطعيمات للمسافرين والمواطنين بمحافظة القاهرة والمرافق التابعة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${tajawal.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <a
          href="#main-content"
          className="absolute start-4 top-0 z-[100] -translate-y-full rounded-md bg-gov-accent px-4 py-3 text-sm font-semibold text-white shadow-md transition-transform focus:translate-y-4"
        >
          تخطي إلى المحتوى الرئيسي
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
