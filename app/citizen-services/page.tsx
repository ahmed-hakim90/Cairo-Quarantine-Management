import type { Metadata } from "next";
import { VaccineSelector } from "@/components/home/VaccineSelector";
import { PageHeading } from "@/components/layout/PageHeading";

export const metadata: Metadata = {
  title: "خدمات المواطنين",
};

export default function CitizenServicesPage() {
  return (
    <>
      <PageHeading
        title="خدمات المواطنين"
        description="معلومات موجهة للمواطنين داخل الجمهورية حول التطعيمات المتاحة والأسعار التوجيهية. الخدمات الفعلية والمواعيد تُحدَّد عبر المراكز المعتمدة والقنوات الرسمية."
      />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-gov-navy">
              الوثائق المطلوبة
            </h2>
            <ul className="mt-3 list-disc space-y-2 ps-6 text-sm leading-relaxed text-gov-gray-700">
              <li>بطاقة الرقم القومي سارية.</li>
              <li>بطاقة التأمين الصحي عند الانطباق.</li>
              <li>أي تقارير طبية ذات صلة بالحالة الصحية.</li>
            </ul>
          </div>
          <div className="rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-gov-navy">
              ملاحظات عامة
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gov-gray-700">
              بعض اللقاحات تُقدَّم مجاناً ضمن البرامج الوطنية. يُعرض ذلك بوضوح في
              أداة الاستعلام عند اختيار اللقاح المناسب.
            </p>
          </div>
        </div>
      </section>
      <VaccineSelector initialCategory="citizen" />
    </>
  );
}
