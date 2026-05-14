import type { VaccineCatalogEntry } from "@/lib/office-requests/types";
import { officeFieldClass } from "@/components/admin/OfficeFormFields";

type VaccineFormFieldsProps = {
  vaccine: VaccineCatalogEntry | null;
};

const CATEGORY_OPTIONS: { value: VaccineCatalogEntry["category"]; label: string }[] =
  [
    { value: "international", label: "مسافر دولي" },
    { value: "hajj", label: "حج" },
    { value: "umrah", label: "عمرة" },
    { value: "citizen", label: "مواطن" },
  ];

export function VaccineFormFields({ vaccine }: VaccineFormFieldsProps) {
  const isEdit = Boolean(vaccine);

  return (
    <>
      {isEdit ? (
        <>
          <input type="hidden" name="id" value={vaccine!.id} />
          <p className="mt-0 text-sm text-gov-gray-600">
            المعرّف:{" "}
            <span className="font-mono font-bold text-gov-navy">{vaccine!.id}</span>
          </p>
        </>
      ) : (
        <label className="mt-0 block text-sm font-bold text-gov-navy">
          المعرّف (لاتيني، بدون مسافات)
          <input
            name="id"
            required
            pattern="[a-z0-9][a-z0-9-]*"
            title="أحرف صغيرة وأرقام وشرطة فقط، يبدأ بحرف أو رقم"
            placeholder="مثال: yellow-fever"
            className={officeFieldClass}
          />
        </label>
      )}
      <label className="mt-3 block text-sm font-bold text-gov-navy">
        الفئة
        <select
          name="category"
          required
          defaultValue={vaccine?.category ?? "international"}
          className={officeFieldClass}
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm font-bold text-gov-navy">
        الاسم بالعربية
        <input
          name="nameAr"
          required
          defaultValue={vaccine?.nameAr ?? ""}
          className={officeFieldClass}
        />
      </label>
      <label className="mt-3 block text-sm font-bold text-gov-navy">
        الاسم بالإنجليزية
        <input
          name="nameEn"
          required
          defaultValue={vaccine?.nameEn ?? ""}
          className={officeFieldClass}
        />
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm font-bold text-gov-navy">
        <input
          name="free"
          type="checkbox"
          defaultChecked={vaccine?.free === true}
        />
        مجاني (يُتجاهل السعر)
      </label>
      <label className="mt-3 block text-sm font-bold text-gov-navy">
        السعر بالجنيه (اختياري إن كان مجانياً)
        <input
          name="priceEgp"
          type="number"
          min={0}
          step={1}
          defaultValue={
            vaccine?.priceEgp != null && Number.isFinite(vaccine.priceEgp)
              ? String(vaccine.priceEgp)
              : ""
          }
          className={officeFieldClass}
        />
      </label>
      <label className="mt-3 block text-sm font-bold text-gov-navy">
        ترتيب العرض داخل الفئة
        <input
          name="sortOrder"
          type="number"
          required
          min={0}
          step={1}
          defaultValue={String(vaccine?.sortOrder ?? 0)}
          className={officeFieldClass}
        />
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm font-bold text-gov-navy">
        <input
          name="active"
          type="checkbox"
          defaultChecked={vaccine?.active !== false}
        />
        نشط (يظهر في الموقع)
      </label>
    </>
  );
}
