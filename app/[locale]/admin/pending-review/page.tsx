import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import {
  getAdminSession,
  shouldShowAdminPendingReview,
} from "@/lib/office-requests/session";
import { logoutAdmin } from "@/app/[locale]/admin/actions";

export const metadata: Metadata = {
  title: "بانتظار مراجعة المسؤول",
};

export default async function AdminPendingReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);
  if (!shouldShowAdminPendingReview(session)) {
    redirect(`/${locale}/admin`);
  }

  return (
    <section className="bg-gov-gray-50">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
        <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm md:p-7">
          <h2 className="font-heading text-xl font-extrabold text-gov-navy">
            بانتظار مراجعة المسؤول
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gov-gray-600">
            لا يمكنك استخدام لوحة التحكم حالياً. إما أن الحساب موقوف أو أنه لم
            يُربَط بعد بمكتب. تواصل مع مسؤول النظام (سوبر أدمن) لتفعيل الحساب
            من صفحة «المستخدمون» وربطه بمكتب أو محافظة.
          </p>
          <p className="mt-3 rounded-md bg-gov-gray-50 px-3 py-2 text-xs text-gov-gray-700">
            البريد المسجّل:{" "}
            <span className="font-bold text-gov-navy" dir="ltr">
              {session.email}
            </span>
          </p>
          <form action={logoutAdmin.bind(null, locale)} className="mt-6">
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-gov-gray-200 px-5 py-3 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50"
            >
              تسجيل خروج
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
