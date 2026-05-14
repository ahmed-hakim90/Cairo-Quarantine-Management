import type { Office } from "@/lib/office-requests/types";

export const officeFieldClass =
  "mt-1 w-full rounded-md border border-gov-gray-200 bg-white px-3 py-2.5 text-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/20";

type OfficeFormFieldsProps = {
  office: Office | null;
};

export function OfficeFormFields({ office }: OfficeFormFieldsProps) {
  const docId =
    office?.id && office.id !== "" && office.id !== "new" ? office.id : "new";

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
          type="url"
          defaultValue={office?.mapsUrl ?? ""}
          className={officeFieldClass}
        />
      </label>
      <label className="mt-3 block text-sm font-bold text-gov-navy">
        نوع الخدمة
        <select
          name="service"
          className={officeFieldClass}
          defaultValue={office?.service ?? "hajj_umrah_travelers"}
        >
          <option value="hajj_umrah_travelers">
            حج وعمرة ومسافرين دوليين
          </option>
          <option value="hajj_umrah_only">حج وعمرة فقط</option>
        </select>
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
