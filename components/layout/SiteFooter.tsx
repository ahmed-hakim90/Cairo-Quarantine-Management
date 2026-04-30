export function SiteFooter() {
  return (
    <footer className="border-t border-gov-gray-200 bg-gov-gray-50 text-gov-gray-700">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="font-heading text-base font-bold text-gov-navy">
              إدارة الحجر الصحي بالقاهرة
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed">
              بوابة معلومات رسمية للمسافرين والمواطنين. للاستفسارات الطارئة يرجى
              التواصل عبر الخطوط المعتمدة أو زيارة أقرب مركز تطعيم معتمد.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-gov-navy">معلومات الاتصال (عرض توضيحي)</p>
            <ul className="mt-3 space-y-2">
              <li>الخط الساخن: ١٦٥٢٨ — على مدار الساعة</li>
              <li>البريد الإلكتروني: info@cqm.gov.eg</li>
              <li>العنوان: القاهرة، جمهورية مصر العربية</li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-gov-gray-200 pt-6 text-center text-xs text-gov-gray-600">
          © {new Date().getFullYear()} — جميع الحقوق محفوظة. المحتوى المعروض للتوعية ولا يغني عن التوجيه الطبي المباشر.
        </p>
      </div>
    </footer>
  );
}
