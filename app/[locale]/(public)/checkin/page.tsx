import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingQueueConfirmPanel } from "@/components/queue/BookingQueueConfirmPanel";
import { CheckinForm } from "@/components/queue/CheckinForm";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import {
  checkinActionCopy,
  checkinBookingCopy,
  checkinPageCopy,
} from "@/lib/i18n/checkin-copy";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getOfficeTravelerStateIds } from "@/lib/office-requests/office-traveler-state";
import { listTravelerStatesForPublicBooking } from "@/lib/office-requests/store";
import { assertActiveOffice } from "@/lib/queue/queue-service";
import { loadQueueBookingPreview } from "@/lib/queue/queue-booking-preview";
import type { TravelerState } from "@/lib/office-requests/types";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ officeId?: string; lookup?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = isLocale(locale) ? locale : "ar";
  const initialLookup = String((await searchParams).lookup ?? "").trim();
  const title = initialLookup
    ? checkinBookingCopy[resolvedLocale].heading
    : checkinPageCopy[resolvedLocale].metaTitle;
  return { title };
}

export default async function CheckinPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ officeId?: string; lookup?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const copy = checkinPageCopy[locale];
  const bookingCopy = checkinBookingCopy[locale];
  const actionCopy = checkinActionCopy[locale];
  const messages = getMessages(locale);

  const officeId = String((await searchParams).officeId ?? "").trim();
  const initialLookup = String((await searchParams).lookup ?? "").trim();
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

  const previewResult = initialLookup
    ? await loadQueueBookingPreview({ lookup: initialLookup, officeId })
    : null;

  const useBookingFlow = Boolean(initialLookup && previewResult?.ok);
  const previewError =
    initialLookup && previewResult && !previewResult.ok
      ? previewResult.reason === "wrong_office"
        ? actionCopy.wrongOffice
        : previewResult.reason === "not_booking"
          ? bookingCopy.notBookingRequest
          : bookingCopy.requestNotFound
      : null;

  return (
    <section className="bg-gov-gray-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <p className="text-xs font-bold uppercase text-gov-accent">
            {useBookingFlow ? bookingCopy.heading : copy.dailyLabel}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold text-gov-navy">
            {useBookingFlow ? bookingCopy.heading : copy.heading}
          </h1>
          <p className="mt-2 text-sm text-gov-gray-700">{officeNameAr}</p>
        </header>

        {previewError ? (
          <div className="mx-auto mb-6 max-w-lg space-y-4">
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900"
            >
              {previewError}
            </p>
            <LocaleLink
              locale={locale}
              href={`/checkin?officeId=${encodeURIComponent(officeId)}`}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-gov-gray-200 bg-white px-4 text-sm font-bold text-gov-navy transition hover:bg-gov-gray-50"
            >
              {bookingCopy.useManualCheckin}
            </LocaleLink>
          </div>
        ) : null}

        {useBookingFlow && previewResult?.ok ? (
          <BookingQueueConfirmPanel
            key={`${officeId}-${previewResult.preview.id}`}
            locale={locale}
            officeId={officeId}
            officeNameAr={officeNameAr}
            preview={previewResult.preview}
            iosHelp={messages.pwa.iosHelp}
          />
        ) : (
          <CheckinForm
            key={`${officeId}-${initialLookup}`}
            locale={locale}
            officeId={officeId}
            officeNameAr={officeNameAr}
            travelerStates={travelerStates}
            iosHelp={messages.pwa.iosHelp}
            initialLookup={initialLookup}
          />
        )}
      </div>
    </section>
  );
}
