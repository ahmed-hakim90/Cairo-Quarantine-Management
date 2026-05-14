import { saveBookingSettingsAction } from "@/app/[locale]/admin/actions";

const fieldClass =
  "mt-2 w-full max-w-xs rounded-md border border-gov-gray-200 bg-white px-3 py-2.5 text-sm focus:border-gov-accent focus:outline-none focus:ring-2 focus:ring-gov-accent/20";

type AdminBookingSettingsFormProps = {
  locale: string;
  initialHour: number;
};

export function AdminBookingSettingsForm({
  locale,
  initialHour,
}: AdminBookingSettingsFormProps) {
  return (
    <form action={saveBookingSettingsAction} className="mt-4 space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <label className="block text-sm font-bold text-gov-navy">
        ساعة إغلاق حجز «نفس اليوم» (توقيت القاهرة، 0–23)
        <input
          type="number"
          name="bookingSameDayCutoffHour"
          min={0}
          max={23}
          required
          defaultValue={initialHour}
          className={fieldClass}
        />
        <p className="mt-2 text-xs leading-relaxed text-gov-gray-600">
          من هذه الساعة فصاعداً (بتوقيت القاهرة) لا يُقبل حجز موعد في نفس اليوم
          التقويمي؛ يُقبل من اليوم التالي. القيمة 14 تعني الساعة 14:00 بنظام 24
          ساعة (2:00 مساءً).
        </p>
      </label>
      <button
        type="submit"
        className="inline-flex min-h-10 items-center justify-center rounded-md bg-gov-accent px-4 text-sm font-bold text-white transition hover:bg-gov-navy"
      >
        حفظ إعدادات الحجز
      </button>
    </form>
  );
}
