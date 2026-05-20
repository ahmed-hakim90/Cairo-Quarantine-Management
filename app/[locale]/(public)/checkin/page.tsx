import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckinForm } from "@/components/queue/CheckinForm";
import { checkinPageCopy } from "@/lib/i18n/checkin-copy";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getOfficeTravelerStateIds } from "@/lib/office-requests/office-traveler-state";
import { listTravelerStatesForPublicBooking } from "@/lib/office-requests/store";
import { assertActiveOffice } from "@/lib/queue/queue-service";
import type { TravelerState } from "@/lib/office-requests/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = isLocale(locale) ? locale : "ar";
  return { title: checkinPageCopy[resolvedLocale].metaTitle };
}

export default async function CheckinPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ officeId?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const copy = checkinPageCopy[locale];
  const messages = getMessages(locale);

  const officeId = String((await searchParams).officeId ?? "").trim();
  if (!officeId) {
    return (
      <section className="bg-gov-gray-50 px-4 py-12">
        <p className="mx-auto max-w-lg text-center text-sm text-gov-gray-700">
          {copy.invalidLink}
        </p>
      </section>
    );
  }

  let officeNameAr: string;
  let travelerStates: TravelerState[] = [];
  try {
    const office = await assertActiveOffice(officeId);
    officeNameAr = office.nameAr;
    const acceptedIds = new Set(getOfficeTravelerStateIds(office));
    travelerStates = (await listTravelerStatesForPublicBooking()).filter((state) =>
      acceptedIds.has(state.id),
    );
  } catch {
    return (
      <section className="bg-gov-gray-50 px-4 py-12">
        <p className="mx-auto max-w-lg text-center text-sm font-semibold text-red-900">
          {copy.officeUnavailable}
        </p>
      </section>
    );
  }

  return (
    <section className="bg-gov-gray-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <p className="text-xs font-bold uppercase text-gov-accent">
            {copy.dailyLabel}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold text-gov-navy">
            {copy.heading}
          </h1>
          <p className="mt-2 text-sm text-gov-gray-700">{officeNameAr}</p>
        </header>
        <CheckinForm
          key={officeId}
          locale={locale}
          officeId={officeId}
          officeNameAr={officeNameAr}
          travelerStates={travelerStates}
          iosHelp={messages.pwa.iosHelp}
        />
      </div>
    </section>
  );
}
