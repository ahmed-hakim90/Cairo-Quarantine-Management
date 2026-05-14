import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isLocale } from "@/lib/i18n/config";
import { getAdminSession } from "@/lib/office-requests/session";

export const metadata: Metadata = {
  title: "تسجيل دخول الإدارة",
};

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (session) redirect(`/${locale}/admin`);

  return (
    <section className="bg-gov-gray-50">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
        <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm md:p-7">
          <h2 className="font-heading text-xl font-extrabold text-gov-navy">
            تسجيل الدخول
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gov-gray-600">
            استخدم البريد وكلمة المرور.
          </p>
          <div className="mt-6">
          <AdminLoginForm redirectTo={`/${locale}/admin`} />
          </div>
        </div>
      </div>
    </section>
  );
}
