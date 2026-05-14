import type { TravelerState } from "@/lib/office-requests/types";
import { officeFieldClass } from "@/components/admin/OfficeFormFields";

type TravelerStateFormFieldsProps = {
  state: TravelerState | null;
};

export function TravelerStateFormFields({ state }: TravelerStateFormFieldsProps) {
  const isEdit = Boolean(state);

  return (
    <>
      {isEdit ? (
        <>
          <input type="hidden" name="id" value={state!.id} />
          <p className="mt-0 text-sm text-gov-gray-600">
            المعرّف:{" "}
            <span className="font-mono font-bold text-gov-navy">{state!.id}</span>
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
            placeholder="مثال: transit-passenger"
            className={officeFieldClass}
          />
        </label>
      )}
      <label className="mt-3 block text-sm font-bold text-gov-navy">
        الاسم بالعربية
        <input
          name="labelAr"
          required
          defaultValue={state?.labelAr ?? ""}
          className={officeFieldClass}
        />
      </label>
      <label className="mt-3 block text-sm font-bold text-gov-navy">
        ترتيب العرض
        <input
          name="sortOrder"
          type="number"
          required
          min={0}
          step={1}
          defaultValue={String(state?.sortOrder ?? 0)}
          className={officeFieldClass}
        />
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm font-bold text-gov-navy">
        <input
          name="active"
          type="checkbox"
          defaultChecked={state?.active !== false}
        />
        نشط (يظهر في نموذج الحجز)
      </label>
    </>
  );
}
