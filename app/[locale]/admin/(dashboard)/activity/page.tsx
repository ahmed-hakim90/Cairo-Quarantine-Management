import { notFound, redirect } from "next/navigation";
import { getCairoTodayYmd } from "@/lib/cairo-today-ymd";
import { isLocale } from "@/lib/i18n/config";
import { resolveActivityLogFirestoreBounds } from "@/lib/office-requests/activity-log-filters";
import { getAdminSession } from "@/lib/office-requests/session";
import {
  listActivityLogsForSuperAdmin,
  listOffices,
  listUserProfiles,
} from "@/lib/office-requests/store";

export const dynamic = "force-dynamic";

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  const first = value?.[0];
  return typeof first === "string" ? first.trim() || undefined : undefined;
}

function userOptionLabel(u: {
  displayName: string;
  email: string | null;
}): string {
  const name = u.displayName.trim();
  if (name) return u.email ? `${name} (${u.email})` : name;
  return u.email ?? u.displayName;
}

export default async function AdminActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);
  if (session.profile.role !== "super_admin") {
    redirect(`/${locale}/admin`);
  }

  const sp = (await searchParams) ?? {};
  const today = getCairoTodayYmd();
  const fromYmd = firstSearchParam(sp.from) ?? today;
  const toYmd = firstSearchParam(sp.to) ?? today;

  const rawOfficeId = firstSearchParam(sp.officeId);
  const rawActorUid = firstSearchParam(sp.actorUid);

  const [offices, users] = await Promise.all([
    listOffices({ includeInactive: true }),
    listUserProfiles(),
  ]);

  let officeFilter: string | null = null;
  if (rawOfficeId) {
    const match = offices.find((o) => o.id === rawOfficeId);
    if (match) officeFilter = match.id;
    else {
      const u = new URLSearchParams();
      u.set("from", fromYmd);
      u.set("to", toYmd);
      if (rawActorUid) u.set("actorUid", rawActorUid);
      redirect(`/${locale}/admin/activity?${u.toString()}`);
    }
  }

  let actorFilter: string | null = null;
  if (rawActorUid) {
    const match = users.find((u) => u.uid === rawActorUid);
    if (match) actorFilter = match.uid;
    else {
      const u = new URLSearchParams();
      u.set("from", fromYmd);
      u.set("to", toYmd);
      if (officeFilter) u.set("officeId", officeFilter);
      redirect(`/${locale}/admin/activity?${u.toString()}`);
    }
  }

  const bounds = resolveActivityLogFirestoreBounds(fromYmd, toYmd);

  const logs = bounds.ok
    ? await listActivityLogsForSuperAdmin({
        limit: 200,
        createdFrom: bounds.createdFrom,
        createdTo: bounds.createdTo,
        officeId: officeFilter,
        actorUid: actorFilter,
      })
    : [];

  const activityHref = `/${locale}/admin/activity`;
  const sortedUsers = [...users].sort((a, b) =>
    userOptionLabel(a).localeCompare(userOptionLabel(b), "ar"),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm md:p-7">
        <h1 className="text-2xl font-extrabold text-gov-navy">سجل النشاط</h1>
        <p className="mt-2 text-sm text-gov-gray-600">
          الافتراضي: أحداث يوم اليوم بتوقيت القاهرة (حتى 200 حدث ضمن الفترة
          والفلاتر). يمكنك تغيير الفترة أو تصفية المكتب أو المستخدم.
        </p>

        <form
          method="get"
          action={activityHref}
          className="mt-6 flex flex-col gap-4 rounded-md border border-gov-gray-100 bg-gov-gray-50/60 p-4 md:flex-row md:flex-wrap md:items-end"
        >
          <div className="flex min-w-[10rem] flex-col gap-1">
            <label htmlFor="activity-from" className="text-xs font-bold text-gov-gray-600">
              من
            </label>
            <input
              id="activity-from"
              name="from"
              type="date"
              defaultValue={fromYmd}
              className="rounded-md border border-gov-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex min-w-[10rem] flex-col gap-1">
            <label htmlFor="activity-to" className="text-xs font-bold text-gov-gray-600">
              إلى
            </label>
            <input
              id="activity-to"
              name="to"
              type="date"
              defaultValue={toYmd}
              className="rounded-md border border-gov-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex min-w-[12rem] flex-1 flex-col gap-1 md:max-w-xs">
            <label htmlFor="activity-office" className="text-xs font-bold text-gov-gray-600">
              المكتب
            </label>
            <select
              id="activity-office"
              name="officeId"
              defaultValue={officeFilter ?? ""}
              className="rounded-md border border-gov-gray-200 px-3 py-2 text-sm"
            >
              <option value="">كل المكاتب</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nameAr}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-[12rem] flex-1 flex-col gap-1 md:max-w-xs">
            <label htmlFor="activity-user" className="text-xs font-bold text-gov-gray-600">
              المستخدم
            </label>
            <select
              id="activity-user"
              name="actorUid"
              defaultValue={actorFilter ?? ""}
              className="rounded-md border border-gov-gray-200 px-3 py-2 text-sm"
            >
              <option value="">كل المستخدمين</option>
              {sortedUsers.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {userOptionLabel(u)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-gov-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-gov-navy"
            >
              تطبيق
            </button>
            <a
              href={activityHref}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gov-navy transition hover:bg-gov-gray-50"
            >
              اليوم
            </a>
          </div>
        </form>

        {!bounds.ok ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {bounds.errorMessage}
          </p>
        ) : null}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gov-gray-200 bg-white shadow-sm">
        {!bounds.ok ? (
          <p className="p-6 text-sm text-gov-gray-600">
            صحّح نطاق التاريخ لعرض السجل.
          </p>
        ) : logs.length === 0 ? (
          <p className="p-6 text-sm text-gov-gray-600">
            لا توجد أحداث ضمن الفترة والفلاتر الحالية.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-gov-gray-200 text-sm">
            <thead className="bg-gov-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gov-gray-600"
                >
                  التاريخ
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gov-gray-600"
                >
                  المنفّذ
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gov-gray-600"
                >
                  الإجراء
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-gray-100">
              {logs.map((row) => (
                <tr key={row.id} className="hover:bg-gov-gray-50/80">
                  <td className="whitespace-nowrap px-4 py-3 text-gov-gray-700">
                    {new Date(row.createdAt).toLocaleString("ar-EG")}
                  </td>
                  <td className="max-w-[10rem] truncate px-4 py-3 font-medium text-gov-navy md:max-w-xs">
                    {row.actorLabel}
                  </td>
                  <td className="px-4 py-3 text-gov-gray-800">{row.summaryAr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
