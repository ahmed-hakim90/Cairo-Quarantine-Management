import { notFound, redirect } from "next/navigation";
import { CatalogExcelImportPanel } from "@/components/admin/CatalogExcelImportPanel";
import { AdminBookingSettingsForm } from "@/components/admin/AdminBookingSettingsForm";
import { AdminMessageTemplatesManager } from "@/components/admin/AdminMessageTemplatesManager";
import { SuperAdminAdvancedSettingsGate } from "@/components/admin/SuperAdminAdvancedSettingsGate";
import { SuperAdminDataToolsPanel } from "@/components/admin/SuperAdminDataToolsPanel";
import { isLocale } from "@/lib/i18n/config";
import { getAdminSession } from "@/lib/office-requests/session";
import { getBookingSettings, listMessageTemplates } from "@/lib/office-requests/store";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);
  if (session.profile.role !== "super_admin") {
    redirect(`/${locale}/admin`);
  }

  const templates = await listMessageTemplates();
  const bookingSettings = await getBookingSettings();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="text-2xl font-extrabold text-gov-navy">الإعدادات</h1>
        <p className="mt-2 text-sm text-gov-gray-600">
          إعدادات الحجز العامة وقوالب رسائل واتساب.
        </p>
      </header>

      <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-gov-navy">إعدادات الحجز العامة</h2>
        <p className="mt-2 text-sm text-gov-gray-600">
          تُحفظ مع إعدادات النظام وتُطبَّق على صفحات الحجز العامة.
        </p>
        <AdminBookingSettingsForm
          locale={locale}
          initialHour={bookingSettings.bookingSameDayCutoffHour}
        />
      </div>

      <CatalogExcelImportPanel
        entity="templates"
        title="تصدير واستيراد قوالب واتساب (Excel)"
        description="صدّر القوالب الحالية، عدّل العنوان ونص الرسالة في Excel، ثم ارفع الملف للمعاينة قبل الحفظ. عند إعادة الرفع يُحدَّث العنوان والنص والحالة فقط؛ معرف القالب ثابت."
        exportFileName="templates-export.xlsx"
        templateFileName="templates-template.xlsx"
      />

      <AdminMessageTemplatesManager locale={locale} templates={templates} />

      <SuperAdminAdvancedSettingsGate>
        <SuperAdminDataToolsPanel />
      </SuperAdminAdvancedSettingsGate>
    </div>
  );
}
