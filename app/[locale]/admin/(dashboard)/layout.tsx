import { notFound, redirect } from "next/navigation";
import { AdminDashboardLayout } from "@/components/admin/AdminDashboardLayout";
import { isLocale } from "@/lib/i18n/config";
import { getAdminSession } from "@/lib/office-requests/session";

export default async function AdminDashboardShellLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);

  return (
    <AdminDashboardLayout
      locale={locale}
      displayName={session.profile.displayName}
      role={session.profile.role}
    >
      {children}
    </AdminDashboardLayout>
  );
}
