import Link from "next/link";
import {
  markWhatsappSentAction,
  updateRequestAction,
} from "@/app/[locale]/admin/actions";
import { RequestWhatsAppPanel } from "@/components/admin/RequestWhatsAppPanel";
import { RequestActivityTimeline } from "@/components/admin/RequestActivityTimeline";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  TRAVELER_CATEGORY_LABELS,
  type AdminActivityLogEntry,
  type MessageTemplate,
  type Office,
  type OfficeRequest,
} from "@/lib/office-requests/types";

type RequestDetailProps = {
  locale: string;
  request: OfficeRequest;
  office: Office;
  whatsappTemplates: MessageTemplate[];
  activityLogs: AdminActivityLogEntry[];
};

const fieldClass =
  "mt-2 w-full rounded-md border border-gov-gray-200 bg-white px-3 py-3 text-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/20";

const statusClass: Record<OfficeRequest["status"], string> = {
  new: "bg-blue-50 text-blue-800 ring-blue-100",
  in_progress: "bg-amber-50 text-amber-800 ring-amber-100",
  contacted: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  completed: "bg-gov-accent-muted text-gov-navy ring-gov-accent-muted",
  cancelled: "bg-red-50 text-red-800 ring-red-100",
};

export function RequestDetail({
  locale,
  request,
  office,
  whatsappTemplates,
  activityLogs,
}: RequestDetailProps) {
  const travelerCategory = request.travelerCategory
    ? TRAVELER_CATEGORY_LABELS[request.travelerCategory]
    : "-";

  return (
    <section className="bg-gov-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href={`/${locale}/admin/requests`}
          className="inline-flex min-h-10 items-center rounded-md border border-gov-gray-200 bg-white px-3 text-sm font-bold text-gov-navy shadow-sm transition hover:border-gov-accent hover:text-gov-accent"
        >
          العودة إلى قائمة الطلبات
        </Link>

      <div className="mt-5 rounded-lg border border-gov-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gov-gray-200 pb-5 md:flex-row md:items-start md:justify-between">
          <div className="px-5 pt-5 md:px-7 md:pt-7">
            <p className="text-sm font-bold text-gov-accent">
              {REQUEST_TYPE_LABELS[request.type]}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-gov-navy">
              {request.name}
            </h1>
            <p className="mt-2 text-sm text-gov-gray-600">
              {request.officeNameAr} - {request.phone}
            </p>
            {request.type === "booking" ? (
              <p className="mt-2 text-sm font-bold text-gov-navy">
                نوع المسافر: {travelerCategory}
                {" - "}
                التاريخ المطلوب: {request.preferredDate ?? "-"}
              </p>
            ) : null}
          </div>
          <div className="px-5 md:px-7 md:pt-7">
            <span
              className={`inline-flex w-fit rounded-md px-3 py-2 text-sm font-extrabold ring-1 ${statusClass[request.status]}`}
            >
              {REQUEST_STATUS_LABELS[request.status]}
            </span>
          </div>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[1.35fr_0.65fr] md:p-7">
          <div>
            <h2 className="font-heading text-lg font-bold text-gov-navy">
              تفاصيل الطلب
            </h2>
            <p className="mt-3 min-h-28 whitespace-pre-wrap rounded-md border border-gov-gray-200 bg-gov-gray-50 p-4 leading-relaxed text-gov-gray-700">
              {request.details}
            </p>
            <h2 className="mt-6 font-heading text-lg font-bold text-gov-navy">
              رسالة واتساب
            </h2>
            <RequestWhatsAppPanel
              phone={request.phone}
              templates={whatsappTemplates}
              request={request}
              office={office}
            />
            <form action={markWhatsappSentAction} className="mt-4">
              <input type="hidden" name="id" value={request.id} />
              <input type="hidden" name="locale" value={locale} />
              <button className="inline-flex min-h-11 items-center justify-center rounded-md border border-gov-gray-200 bg-white px-5 py-3 text-sm font-bold text-gov-navy hover:bg-gov-gray-50">
                تسجيل أنه تم التواصل
              </button>
            </form>
          </div>

          <form
            action={updateRequestAction}
            className="self-start rounded-md border border-gov-gray-200 bg-gov-gray-50 p-4"
          >
            <input type="hidden" name="id" value={request.id} />
            <input type="hidden" name="locale" value={locale} />
            <h2 className="font-heading text-lg font-bold text-gov-navy">
              إجراء المكتب
            </h2>
            <label className="mt-4 block text-sm font-bold text-gov-navy">
              الحالة
              <select
                name="status"
                defaultValue={request.status}
                className={fieldClass}
              >
                {Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm font-bold text-gov-navy">
              ملاحظات المتابعة
              <textarea
                name="notes"
                rows={8}
                defaultValue={request.notes}
                className={fieldClass}
              />
            </label>
            <button className="mt-4 w-full rounded-md bg-gov-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-gov-navy">
              حفظ الإجراء
            </button>
          </form>
        </div>

        <dl className="grid gap-4 border-t border-gov-gray-200 bg-gov-gray-50 p-5 text-sm md:grid-cols-3 md:p-7">
          {request.type === "booking" ? (
            <>
              <div>
                <dt className="font-bold text-gov-navy">نوع المسافر</dt>
                <dd className="mt-1 text-gov-gray-700">{travelerCategory}</dd>
              </div>
              <div>
                <dt className="font-bold text-gov-navy">التاريخ المطلوب</dt>
                <dd className="mt-1 text-gov-gray-700">
                  {request.preferredDate ?? "-"}
                </dd>
              </div>
            </>
          ) : null}
          <div>
            <dt className="font-bold text-gov-navy">العنوان</dt>
            <dd className="mt-1 text-gov-gray-700">{office.addressAr}</dd>
          </div>
          <div>
            <dt className="font-bold text-gov-navy">تاريخ الطلب</dt>
            <dd className="mt-1 text-gov-gray-700">
              {new Date(request.createdAt).toLocaleString("ar-EG")}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-gov-navy">آخر تحديث</dt>
            <dd className="mt-1 text-gov-gray-700">
              {new Date(request.updatedAt).toLocaleString("ar-EG")}
            </dd>
          </div>
        </dl>

        <div className="border-t border-gov-gray-200 p-5 md:p-7">
          <h2 className="font-heading text-lg font-bold text-gov-navy">
            سجل النشاط
          </h2>
          <RequestActivityTimeline entries={activityLogs} />
        </div>
      </div>
      </div>
    </section>
  );
}
