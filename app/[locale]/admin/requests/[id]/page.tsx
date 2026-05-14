import { notFound, redirect } from "next/navigation";
import { RequestDetail } from "@/components/admin/RequestDetail";
import { isLocale } from "@/lib/i18n/config";
import { getAdminSession } from "@/lib/office-requests/session";
import {
  getOffice,
  getRequestForSession,
  listMessageTemplates,
} from "@/lib/office-requests/store";

export default async function AdminRequestPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);

  const request = await getRequestForSession({
    id,
    role: session.profile.role,
    officeId: session.profile.officeId,
  });
  if (!request) notFound();

  const [office, templates] = await Promise.all([
    getOffice(request.officeId),
    listMessageTemplates(),
  ]);
  if (!office) notFound();

  const template = templates.find((item) => item.active) ?? templates[0];
  if (!template) notFound();

  return (
    <RequestDetail
      locale={locale}
      request={request}
      office={office}
      template={template}
    />
  );
}
