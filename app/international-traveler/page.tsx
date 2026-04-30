import type { Metadata } from "next";
import { VaccineSelector } from "@/components/home/VaccineSelector";
import { PageHeading } from "@/components/layout/PageHeading";

export const metadata: Metadata = {
  title: "مسافر دولي",
};

export default function InternationalTravelerPage() {
  return (
    <>
      <PageHeading
        title="خدمات المسافر الدولي"
        description="إرشادات رسمية حول التطعيمات والفحوصات المطلوبة وفق وجهة السفر وحالة الوصول إلى جمهورية مصر العربية. يرجى التحقق من آخر التحديثات الصادرة عن الجهات المختصة قبل السفر."
      />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="font-heading text-xl font-bold text-gov-navy">
            قبل السفر
          </h2>
          <ul className="mt-4 list-disc space-y-2 ps-6 text-gov-gray-700 leading-relaxed">
            <li>احرص على إحضار جواز السفر ساري المفعول وأي مستندات صحية مطلوبة.</li>
            <li>راجع متطلبات وجهتك بخصوص التطعيمات الإلزامية أو الموصى بها.</li>
            <li>احجز موعداً مسبقاً في مركز تطعيم معتمد عند الحاجة.</li>
          </ul>
        </div>
      </section>
      <VaccineSelector initialCategory="international" />
    </>
  );
}
