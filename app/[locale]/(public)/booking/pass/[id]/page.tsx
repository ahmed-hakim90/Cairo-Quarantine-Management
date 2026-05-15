import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { bookingPassPageCopy } from "@/lib/i18n/booking-pass-copy";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { mergeTravelerStateLabelsWithLegacy } from "@/lib/office-requests/office-traveler-state";
import { getBookingPassPublic, listTravelerStates } from "@/lib/office-requests/store";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  TRAVELER_CATEGORY_LABELS,
} from "@/lib/office-requests/types";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function formatIsoDate(iso: string, locale: Locale): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(
      locale === "ar" ? "ar-EG" : locale === "zh" ? "zh-CN" : "en-GB",
      { dateStyle: "medium" },
    ).format(d);
  } catch {
    return iso;
  }
}

export default async function BookingPassPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: localeParam, id } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;

  const sp = (await searchParams) ?? {};
  const rawT = sp.t;
  const token = Array.isArray(rawT) ? rawT[0] : rawT;
  if (!token || typeof token !== "string") {
    return <InvalidPass locale={locale} />;
  }

  const pass = await getBookingPassPublic({ id, token });
  if (!pass) {
    return <InvalidPass locale={locale} />;
  }

  const travelerLabels = pass.travelerStateId
    ? mergeTravelerStateLabelsWithLegacy(await listTravelerStates())
    : {};
  const traveler = pass.travelerStateId
    ? travelerLabels[pass.travelerStateId] ?? pass.travelerStateId
    : pass.travelerCategory
      ? TRAVELER_CATEGORY_LABELS[pass.travelerCategory]
      : "—";

  const c = bookingPassPageCopy[locale];

  return (
    <section className="min-h-[70vh] bg-gradient-to-b from-gov-navy-deep to-gov-navy text-white">
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-teal-200/90">
          {c.siteLine}
        </p>
        <h1 className="mt-2 text-center font-heading text-2xl font-extrabold">
          {c.title}
        </h1>
        <p className="mt-2 text-center text-sm text-teal-100/90">
          {pass.type === "complaint" ? c.subtitleComplaint : c.subtitle}
        </p>

        <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-6 shadow-xl backdrop-blur-sm">
          <dl className="space-y-4 text-sm">
            <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
              <dt className="text-xs font-bold uppercase tracking-wide text-teal-200/80">
                {c.requestId}
              </dt>
              <dd className="text-lg font-extrabold tracking-wide">#{pass.id}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-teal-200/80">{c.office}</dt>
              <dd className="mt-1 font-semibold leading-snug">{pass.officeNameAr}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-teal-200/80">{c.type}</dt>
              <dd className="mt-1">{REQUEST_TYPE_LABELS[pass.type]}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-teal-200/80">{c.status}</dt>
              <dd className="mt-1">{REQUEST_STATUS_LABELS[pass.status]}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-teal-200/80">{c.name}</dt>
              <dd className="mt-1 font-semibold">{pass.name}</dd>
            </div>
            {pass.type === "booking" ? (
              <>
                <div>
                  <dt className="text-xs font-bold text-teal-200/80">
                    {c.travelerType}
                  </dt>
                  <dd className="mt-1">{traveler}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-teal-200/80">
                    {c.preferredDate}
                  </dt>
                  <dd className="mt-1 font-mono">{pass.preferredDate ?? "—"}</dd>
                </div>
              </>
            ) : null}
            <div>
              <dt className="text-xs font-bold text-teal-200/80">{c.details}</dt>
              <dd className="mt-1 whitespace-pre-wrap leading-relaxed text-white/95">
                {pass.details || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-teal-200/80">{c.notes}</dt>
              <dd className="mt-1 whitespace-pre-wrap leading-relaxed text-white/90">
                {pass.notes?.trim() ? pass.notes : c.noNotes}
              </dd>
            </div>
            <div className="border-t border-white/10 pt-3 text-xs text-teal-100/70">
              <p>
                {formatIsoDate(pass.createdAt, locale)} —{" "}
                {formatIsoDate(pass.updatedAt, locale)}
              </p>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function InvalidPass({ locale }: { locale: Locale }) {
  const c = bookingPassPageCopy[locale];
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center bg-gov-gray-50 px-4 py-16">
      <div className="max-w-md rounded-2xl border border-gov-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-heading text-xl font-extrabold text-gov-navy">
          {c.invalidTitle}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gov-gray-600">
          {c.invalidBody}
        </p>
      </div>
    </section>
  );
}
