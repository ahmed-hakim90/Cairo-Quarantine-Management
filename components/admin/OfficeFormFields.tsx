import type { Office, TravelerState } from "@/lib/office-requests/types";
import {
  defaultTravelerStatesFromLegacyLabels,
  getOfficeTravelerStateIds,
} from "@/lib/office-requests/office-traveler-state";

export const officeFieldClass =
  "mt-1 w-full rounded-md border border-gov-gray-200 bg-white px-3 py-2.5 text-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/20";

type OfficeFormFieldsProps = {
  office: Office | null;
  travelerStates: TravelerState[];
};

export function OfficeFormFields({ office, travelerStates }: OfficeFormFieldsProps) {
  const docId =
    office?.id && office.id !== "" && office.id !== "new" ? office.id : "new";

  const statesList =
    travelerStates.length > 0
      ? travelerStates
      : defaultTravelerStatesFromLegacyLabels();

  const baseOffice: Office =
    office ?? {
      id: "new",
      administrationAr: "",
      nameAr: "",
      addressAr: "",
      phone: null,
      mapsUrl: "",
      service: "hajj_umrah_travelers",
      active: true,
    };
  const acceptedIds = getOfficeTravelerStateIds(baseOffice);
  const extraIds = acceptedIds.filter(
    (id) => !statesList.some((s) => s.id === id),
  );
  const displayStates: TravelerState[] = [
    ...statesList,
    ...extraIds.map((id) => ({
      id,
      labelAr: id,
      sortOrder: 999,
      active: true,
    })),
  ];
  displayStates.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });

  return (
    <>
      <input type="hidden" name="id" value={docId} />
      <label className="mt-0 block text-sm font-bold text-gov-navy">
        الإدارة
        <input
          name="administrationAr"
          required
          defaultValue={office?.administrationAr ?? ""}
          className={officeFieldClass}
        />
      </label>
      <label className="mt-3 block text-sm font-bold text-gov-navy">
        اسم المكتب
        <input
          name="nameAr"
          required
          defaultValue={office?.nameAr ?? ""}
          className={officeFieldClass}
        />
      </label>
      <label className="mt-3 block text-sm font-bold text-gov-navy">
        العنوان
        <textarea
          name="addressAr"
          required
          rows={3}
          defaultValue={office?.addressAr ?? ""}
          className={officeFieldClass}
        />
      </label>
      <label className="mt-3 block text-sm font-bold text-gov-navy">
        الهاتف
        <input
          name="phone"
          type="tel"
          defaultValue={office?.phone ?? ""}
          className={officeFieldClass}
          placeholder="اختياري"
        />
      </label>
      <label className="mt-3 block text-sm font-bold text-gov-navy">
        رابط الخرائط
        <input
          name="mapsUrl"
          required
          type="text"
          defaultValue={office?.mapsUrl ?? ""}
          className={officeFieldClass}
        />
      </label>
      <fieldset className="mt-3 rounded-md border border-gov-gray-200 p-3">
        <legend className="px-1 text-sm font-bold text-gov-navy">
          حالات المسافرين التي يخدمها المكتب
        </legend>
        <p className="mt-1 text-xs text-gov-gray-600">
          اترك الكل بلا اختيار عند التعديل ليبقى الاشتقاق من نوع الخدمة
          المخزَّن في السجل؛ عند إضافة مكتب جديد بلا اختيار يُستخدم الافتراضي
          الواسع (يشمل المسافر الدولي). عند تحديد حالات صراحةً يُحدَّث نوع
          الخدمة في السجل تلقائياً ليتوافق معها.
        </p>
        <div className="mt-3 space-y-2">
          {displayStates.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2 text-sm font-semibold text-gov-gray-800"
            >
              <input
                type="checkbox"
                name="travelerStateIds"
                value={s.id}
                defaultChecked={acceptedIds.includes(s.id)}
                className="size-4 rounded border-gov-gray-300"
              />
              <span>
                {s.labelAr}
                {!s.active ? (
                  <span className="ms-1 text-xs font-normal text-gov-gray-500">
                    (معطّلة)
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-3 block text-sm font-bold text-gov-navy">
        الحد الأقصى لحجوزات اليوم الواحد
        <input
          name="dailyBookingCap"
          type="number"
          min={1}
          inputMode="numeric"
          className={officeFieldClass}
          placeholder="اتركه فارغاً = بلا حد"
          defaultValue={
            office?.dailyBookingCap != null && office.dailyBookingCap > 0
              ? String(office.dailyBookingCap)
              : ""
          }
        />
        <span className="mt-1 block text-xs font-normal text-gov-gray-600">
          عدد طلبات الحجز المسموح بها لكل يوم تقويمي لهذا المكتب (يشمل الطلبات
          الملغاة في العدّ). فارغ = لا يوجد حد.
        </span>
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm font-bold text-gov-navy">
        <input
          name="active"
          type="checkbox"
          defaultChecked={office?.active !== false}
        />
        مكتب نشط (يظهر للمسافرين)
      </label>
    </>
  );
}
