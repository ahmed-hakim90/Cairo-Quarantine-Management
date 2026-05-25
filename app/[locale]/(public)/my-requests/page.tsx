import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { MyRequestsPanel } from "@/components/requests/MyRequestsPanel";
import { inferredSiteOriginFromHeaders } from "@/lib/booking-pass-url";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "طلباتي",
};

export default async function MyRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const headerList = await headers();
  const serverSiteOrigin = inferredSiteOriginFromHeaders(headerList);

  return (
    <section className="bg-gov-gray-50">
      <MyRequestsPanel
        locale={locale as Locale}
        serverSiteOrigin={serverSiteOrigin}
      />
    </section>
  );
}
