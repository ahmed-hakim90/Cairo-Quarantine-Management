import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MyRequestsPanel } from "@/components/requests/MyRequestsPanel";
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

  return (
    <section className="bg-gov-gray-50">
      <MyRequestsPanel locale={locale as Locale} />
    </section>
  );
}
