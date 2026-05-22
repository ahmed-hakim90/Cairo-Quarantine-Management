import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import {
  getAdminSession,
  shouldShowAdminPendingReview,
} from "@/lib/office-requests/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return {
    title: m.admin.meta.loginTitle,
  };
}

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const messages = getMessages(locale);

  const session = await getAdminSession();
  if (session) {
    if (shouldShowAdminPendingReview(session)) {
      redirect(`/${locale}/admin/pending-review`);
    }
    redirect(`/${locale}/admin`);
  }

  const { auth } = messages.admin;

  return (
    <AdminAuthShell
      locale={locale}
      messages={messages}
      title={auth.loginTitle}
      subtitle={auth.loginSubtitle}
    >
      <AdminLoginForm
        redirectTo={`/${locale}/admin`}
        copy={auth}
      />
    </AdminAuthShell>
  );
}
