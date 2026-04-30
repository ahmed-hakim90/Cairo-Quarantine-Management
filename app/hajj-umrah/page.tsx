import type { Metadata } from "next";
import { HajjTravelerOfficesTable } from "@/components/hajj/HajjTravelerOfficesTable";
import { VaccineSelector } from "@/components/home/VaccineSelector";
import { PageHeading } from "@/components/layout/PageHeading";

export const metadata: Metadata = {
  title: "الحج والعمرة",
};

export default function HajjUmrahPage() {
  return (
    <>
      <PageHeading
        title="الحج والعمرة — المتطلبات الصحية"
        description="تنظم هذه الصفحة المعلومات التوجيهية الخاصة بالتطعيمات المعتمدة للحج والعمرة. يجب الالتزام بالقرارات الرسمية الصادرة عن وزارة الصحة والجهات السعودية المختصة."
      />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="font-heading text-xl font-bold text-gov-navy">
            التطعيمات الأساسية
          </h2>
          <p className="mt-4 leading-relaxed text-gov-gray-700">
            يُطلب عادةً استكمال تطعيم التهاب السحايا وفق اللقاحات المعتمدة، مع
            الاحتفاظ بشهادة معتمدة تُعرض عند السفر. قد تُحدَّث القائمة وفق
            الموسم؛ يُرجى متابعة الإعلانات الرسمية.
          </p>
        </div>
      </section>
      <VaccineSelector initialCategory="hajj" />
      <HajjTravelerOfficesTable />
      <section
        id="instructions"
        className="mx-auto max-w-6xl px-4 py-14"
        aria-labelledby="hajj-instructions-heading"
      >
        <h2
          id="hajj-instructions-heading"
          className="font-heading text-2xl font-bold text-gov-navy"
        >
          تعليمات الحج والعمرة
        </h2>
        <div className="mt-6 space-y-4 text-gov-gray-700 leading-relaxed">
          <p>
            احضر بطاقة الهوية أو جواز السفر وأصل شهادات التطعيم المعتمدة، وتأكد من
            مطابقة البيانات الشخصية لجميع الوثائق.
          </p>
          <p>
            في حال ظهور أعراض تنفسية حادة، يُفضَّل تأجيل السفر والتواصل مع خط
            الإرشاد الطبي قبل الحضور إلى المركز.
          </p>
          <p>
            احتفظ بنسخة إلكترونية من الوثائق الصحية وتجنّب ازدحام غير منظم داخل
            المراكز؛ إجراءات التنظيم تُعلَن رسمياً عبر القنوات المعتمدة.
          </p>
        </div>
      </section>
      <section className="border-t border-gov-gray-200 bg-gov-gray-50 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-heading text-xl font-bold text-gov-navy">
            مسار العمرة
          </h2>
          <p className="mt-3 max-w-3xl text-gov-gray-700 leading-relaxed">
            لاستعراض اللقاحات الشائعة لمسار العمرة، يمكنك استخدام أداة الاستعلام
            أعلاه واختيار فئة «عمرة» من القائمة المنسدلة.
          </p>
        </div>
      </section>
    </>
  );
}
