import Link from "next/link";
import {
  logoutAdmin,
  saveTemplateAction,
  saveUserProfileAction,
} from "@/app/[locale]/admin/actions";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  TRAVELER_CATEGORY_LABELS,
  type AdminSession,
  type AdminUserProfile,
  type MessageTemplate,
  type Office,
  type OfficeRequest,
} from "@/lib/office-requests/types";

type AdminDashboardProps = {
  locale: string;
  session: AdminSession;
  offices: Office[];
  requests: OfficeRequest[];
  templates: MessageTemplate[];
  users: AdminUserProfile[];
};

const fieldClass =
  "mt-1 w-full rounded-md border border-gov-gray-200 bg-white px-3 py-2.5 text-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/20";

const statusClass: Record<OfficeRequest["status"], string> = {
  new: "bg-blue-50 text-blue-800 ring-blue-100",
  in_progress: "bg-amber-50 text-amber-800 ring-amber-100",
  contacted: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  completed: "bg-gov-accent-muted text-gov-navy ring-gov-accent-muted",
  cancelled: "bg-red-50 text-red-800 ring-red-100",
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase text-gov-gray-600">{label}</p>
      <p className="mt-2 text-3xl font-extrabold leading-none text-gov-navy">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: OfficeRequest["status"] }) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-extrabold ring-1 ${statusClass[status]}`}
    >
      {REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

function BookingMeta({ request }: { request: OfficeRequest }) {
  if (request.type !== "booking") return null;

  const category = request.travelerCategory
    ? TRAVELER_CATEGORY_LABELS[request.travelerCategory]
    : null;

  return (
    <span className="mt-1 block text-xs leading-relaxed text-gov-gray-600">
      {[category, request.preferredDate].filter(Boolean).join(" - ") || "-"}
    </span>
  );
}

export function AdminDashboard({
  locale,
  session,
  offices,
  requests,
  templates,
  users,
}: AdminDashboardProps) {
  const isSuperAdmin = session.profile.role === "super_admin";
  const newCount = requests.filter((request) => request.status === "new").length;
  const activeCount = requests.filter(
    (request) =>
      request.status === "new" ||
      request.status === "in_progress" ||
      request.status === "contacted",
  ).length;

  return (
    <section className="bg-gov-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="inline-flex rounded-md bg-gov-accent-muted px-3 py-1 text-sm font-bold text-gov-navy">
            {isSuperAdmin ? "سوبر أدمن" : "مستخدم مكتب"}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-gov-navy">
            لوحة متابعة الحجوزات والطلبات
          </h1>
          <p className="mt-2 text-sm text-gov-gray-600">
            مرحباً {session.profile.displayName}
          </p>
        </div>
        <form action={logoutAdmin.bind(null, locale)}>
          <button className="inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-200 px-4 py-2 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50">
            تسجيل خروج
          </button>
        </form>
      </div>
      </div>

      <div className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي الطلبات" value={requests.length} />
        <StatCard label="طلبات جديدة" value={newCount} />
        <StatCard label="قيد المتابعة" value={activeCount} />
        <StatCard label="المكاتب المتاحة" value={offices.length} />
      </div>

      <div className="rounded-lg border border-gov-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gov-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-lg font-bold text-gov-navy">
            أحدث الطلبات
          </h2>
          <p className="text-sm text-gov-gray-600">آخر 200 طلب حسب الصلاحية</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gov-gray-200 text-sm">
            <thead className="bg-gov-gray-50 text-gov-navy">
              <tr>
                <th className="px-4 py-3 text-start">الاسم</th>
                <th className="px-4 py-3 text-start">الهاتف</th>
                <th className="px-4 py-3 text-start">المكتب</th>
                <th className="px-4 py-3 text-start">النوع</th>
                <th className="px-4 py-3 text-start">الحالة</th>
                <th className="px-4 py-3 text-start">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-gray-100">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gov-gray-50/70">
                  <td className="px-4 py-3 font-bold text-gov-navy">
                    {request.name}
                  </td>
                  <td className="px-4 py-3">{request.phone}</td>
                  <td className="px-4 py-3">{request.officeNameAr}</td>
                  <td className="px-4 py-3">
                    {REQUEST_TYPE_LABELS[request.type]}
                    <BookingMeta request={request} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/${locale}/admin/requests/${request.id}`}
                      className="inline-flex min-h-9 items-center rounded-md border border-gov-gray-200 px-3 text-xs font-extrabold text-gov-navy transition hover:border-gov-accent hover:text-gov-accent"
                    >
                      التفاصيل
                    </Link>
                  </td>
                </tr>
              ))}
              {requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gov-gray-600"
                  >
                    لا توجد طلبات حالياً.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {isSuperAdmin ? (
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="font-heading text-xl font-extrabold text-gov-navy">
              إعدادات السوبر أدمن
            </h2>
            <p className="mt-1 text-sm text-gov-gray-600">
              إدارة المكاتب والرسائل وربط مستخدمي Firebase بالمكاتب.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
          <form
            action={saveTemplateAction}
            className="rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm"
          >
            <h2 className="font-heading text-lg font-bold text-gov-navy">
              تمبلت واتساب
            </h2>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="id" value={templates[0]?.id ?? "new"} />
            <label className="mt-4 block text-sm font-bold text-gov-navy">
              العنوان
              <input
                name="title"
                required
                defaultValue={templates[0]?.title}
                className={fieldClass}
              />
            </label>
            <label className="mt-3 block text-sm font-bold text-gov-navy">
              نص الرسالة
              <textarea
                name="body"
                required
                rows={10}
                defaultValue={templates[0]?.body}
                className={fieldClass}
              />
            </label>
            <p className="mt-2 text-xs leading-relaxed text-gov-gray-600">
              المتغيرات: {"{name}"} {"{officeName}"} {"{officeAddress}"}{" "}
              {"{officeMapUrl}"}
            </p>
            <label className="mt-3 flex items-center gap-2 text-sm font-bold text-gov-navy">
              <input name="active" type="checkbox" defaultChecked={templates[0]?.active} />
              مفعل
            </label>
            <button className="mt-4 w-full rounded-md bg-gov-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-gov-navy">
              حفظ التمبلت
            </button>
          </form>

          <form
            action={saveUserProfileAction}
            className="rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm"
          >
            <h2 className="font-heading text-lg font-bold text-gov-navy">
              إنشاء / تعديل مستخدم
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-gov-gray-600">
              اترك UID فارغاً لإنشاء مستخدم جديد. اكتب UID موجود لتعديل
              المستخدم أو تغيير مكتبه.
            </p>
            <input type="hidden" name="locale" value={locale} />
            <label className="mt-4 block text-sm font-bold text-gov-navy">
              Firebase UID للتعديل
              <input
                name="uid"
                className={fieldClass}
                placeholder="اختياري عند إنشاء مستخدم جديد"
              />
            </label>
            <label className="mt-3 block text-sm font-bold text-gov-navy">
              الاسم
              <input name="displayName" required className={fieldClass} />
            </label>
            <label className="mt-3 block text-sm font-bold text-gov-navy">
              البريد
              <input name="email" type="email" required className={fieldClass} />
            </label>
            <label className="mt-3 block text-sm font-bold text-gov-navy">
              كلمة المرور
              <input
                name="password"
                type="password"
                minLength={6}
                className={fieldClass}
                placeholder="مطلوبة عند الإنشاء فقط"
              />
            </label>
            <label className="mt-3 block text-sm font-bold text-gov-navy">
              الصلاحية
              <select name="role" className={fieldClass}>
                <option value="office_user">مستخدم مكتب</option>
                <option value="super_admin">سوبر أدمن</option>
              </select>
            </label>
            <label className="mt-3 block text-sm font-bold text-gov-navy">
              المكتب
              <select name="officeId" className={fieldClass}>
                <option value="">بدون</option>
                {offices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.nameAr}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm font-bold text-gov-navy">
              <input name="active" type="checkbox" defaultChecked />
              مفعل
            </label>
            <button className="mt-4 w-full rounded-md bg-gov-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-gov-navy">
              حفظ المستخدم
            </button>
            {users.length > 0 ? (
              <div className="mt-4 rounded-md bg-gov-gray-50 p-3">
                <p className="text-xs font-bold text-gov-navy">
                  المستخدمون المسجلون: {users.length}
                </p>
                <ul className="mt-2 space-y-2 text-xs text-gov-gray-700">
                  {users.slice(0, 6).map((user) => (
                    <li key={user.uid} className="border-t border-gov-gray-200 pt-2 first:border-t-0 first:pt-0">
                      <span className="block font-bold text-gov-navy">
                        {user.displayName}
                      </span>
                      <span className="block">
                        {user.role === "super_admin"
                          ? "سوبر أدمن"
                          : offices.find((office) => office.id === user.officeId)
                            ?.nameAr || "مستخدم مكتب"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </form>
          </div>
        </div>
      ) : null}
      </div>
    </section>
  );
}
