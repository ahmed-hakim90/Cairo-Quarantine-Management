import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckinForm } from "@/components/queue/CheckinForm";
import { isLocale } from "@/lib/i18n/config";
import { assertActiveOffice } from "@/lib/queue/queue-service";

export const metadata: Metadata = {
  title: "تسجيل الحضور",
};

export default async function CheckinPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ officeId?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const officeId = String((await searchParams).officeId ?? "").trim();
  if (!officeId) {
    return (
      <section className="bg-gov-gray-50 px-4 py-12">
        <p className="mx-auto max-w-lg text-center text-sm text-gov-gray-700">
          رابط غير صالح. امسح رمز QR الخاص بالمكتب أو اطلب الرابط الصحيح من
          الموظف.
        </p>
      </section>
    );
  }

  let officeNameAr: string;
  try {
    const office = await assertActiveOffice(officeId);
    officeNameAr = office.nameAr;
  } catch {
    return (
      <section className="bg-gov-gray-50 px-4 py-12">
        <p className="mx-auto max-w-lg text-center text-sm font-semibold text-red-900">
          المكتب غير متاح أو الرابط غير صحيح.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-gov-gray-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <p className="text-xs font-bold uppercase text-gov-accent">
            حضور يومي
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold text-gov-navy">
            تسجيل الحضور
          </h1>
          <p className="mt-2 text-sm text-gov-gray-700">{officeNameAr}</p>
        </header>
        <CheckinForm officeId={officeId} officeNameAr={officeNameAr} />
      </div>
    </section>
  );
}
