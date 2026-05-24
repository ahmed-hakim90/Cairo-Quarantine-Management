import { notFound, redirect } from "next/navigation";
import { RequestDetail } from "@/components/admin/RequestDetail";
import { isLocale } from "@/lib/i18n/config";
import { canViewFeedbackRequests } from "@/lib/office-requests/admin-access";
import { getAdminSession } from "@/lib/office-requests/session";
import {
  getOffice,
  getRequestForSession,
  listActivityLogsForRequest,
  listMessageTemplates,
  listTravelerStates,
} from "@/lib/office-requests/store";
import { mergeTravelerStateLabelsWithLegacy } from "@/lib/office-requests/office-traveler-state";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/office-requests/types";

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
    allowedOfficeIds: session.profile.allowedOfficeIds,
  });
  if (!request) notFound();
  if (!canViewFeedbackRequests(session.profile.role)) notFound();
  if (request.type === "booking") notFound();

  const [office, templates, activityLogs, travelerStates] = await Promise.all([
    getOffice(request.officeId),
    listMessageTemplates(),
    listActivityLogsForRequest({
      requestId: id,
      role: session.profile.role,
      officeId: session.profile.officeId,
      allowedOfficeIds: session.profile.allowedOfficeIds,
    }),
    listTravelerStates({ includeInactive: true }),
  ]);
  if (!office) notFound();

  const travelerStateLabels = mergeTravelerStateLabelsWithLegacy(travelerStates);

  const activeTemplates = templates.filter((item) => item.active);
  const whatsappTemplates =
    activeTemplates.length > 0
      ? activeTemplates
      : [
          {
            id: "default",
            title: "رسالة متابعة افتراضية",
            body: DEFAULT_MESSAGE_TEMPLATE,
            active: true,
          },
        ];

  return (
    <RequestDetail
      locale={locale}
      request={request}
      office={office}
      whatsappTemplates={whatsappTemplates}
      activityLogs={activityLogs}
      travelerStateLabels={travelerStateLabels}
      isSuperAdmin={session.profile.role === "super_admin"}
    />
  );
}
