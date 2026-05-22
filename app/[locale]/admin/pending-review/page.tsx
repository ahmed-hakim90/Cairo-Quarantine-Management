import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import {
  getAdminSession,
  shouldShowAdminPendingReview,
} from "@/lib/office-requests/session";
import { logoutAdmin } from "@/app/[locale]/admin/actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return {
    title: m.admin.meta.pendingReviewTitle,
  };
}

export default async function AdminPendingReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const messages = getMessages(locale);

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);
  if (!shouldShowAdminPendingReview(session)) {
    redirect(`/${locale}/admin`);
  }

  const { pendingReview } = messages.admin;

  return (
    <AdminAuthShell
      locale={locale}
      messages={messages}
      title={pendingReview.title}
      subtitle={pendingReview.body}
    >
      <p className="rounded-md bg-gov-gray-50 px-3 py-2 text-xs text-gov-gray-700">
        {pendingReview.registeredEmail}{" "}
        <span className="font-bold text-gov-navy" dir="ltr">
          {session.email}
        </span>
      </p>
      <form action={logoutAdmin.bind(null, locale)} className="mt-6">
        <button
          type="submit"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-gov-gray-200 px-5 py-3 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50"
        >
          {pendingReview.logout}
        </button>
      </form>
    </AdminAuthShell>
  );
}
