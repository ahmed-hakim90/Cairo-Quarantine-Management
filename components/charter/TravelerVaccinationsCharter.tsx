import type { TravelerVaccinationsOfficeCharter } from "@/data/traveler-vaccinations-office-charter";
import type { Locale } from "@/lib/i18n/config";
import type { ReactNode } from "react";

type TravelerVaccinationsCharterProps = {
  locale: Locale;
  document: TravelerVaccinationsOfficeCharter;
  tocTitle: string;
  /** For `aria-labelledby` on the wrapping page section */
  titleHeadingId?: string;
};

function articleLang(locale: Locale): string {
  if (locale === "zh") return "zh-CN";
  if (locale === "fr") return "fr";
  return locale;
}

function articleDir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

function CharterBodySection({
  headingId,
  title,
  isFirst,
  children,
}: {
  headingId: string;
  title: string;
  isFirst?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className={
        isFirst
          ? undefined
          : "border-t border-gov-gray-100 pt-12"
      }
    >
      <div className="border-s-4 border-gov-navy ps-4 sm:ps-5">
        <h3
          id={headingId}
          className="font-heading text-xl font-bold text-gov-navy"
        >
          {title}
        </h3>
        {children}
      </div>
    </section>
  );
}

export function TravelerVaccinationsCharter({
  locale,
  document: d,
  tocTitle,
  titleHeadingId,
}: TravelerVaccinationsCharterProps) {
  const tocItems = [
    { id: "charter-intro-heading", label: d.introduction.heading },
    { id: "charter-vision-heading", label: d.vision.heading },
    { id: "charter-mission-heading", label: d.mission.heading },
    { id: "charter-values-heading", label: d.values.heading },
    { id: "charter-commitments-heading", label: d.officeCommitments.heading },
    { id: "charter-rights-heading", label: d.rights.heading },
    { id: "charter-duties-heading", label: d.duties.heading },
    { id: "charter-complaints-heading", label: d.complaints.heading },
    { id: "charter-hours-heading", label: d.workingHours.heading },
  ];

  return (
    <article
      lang={articleLang(locale)}
      dir={articleDir(locale)}
      className="mx-auto max-w-3xl rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm md:p-8"
    >
      <header className="border-b border-gov-gray-200 pb-6 text-center">
        <h2
          id={titleHeadingId}
          className="font-heading text-2xl font-bold text-gov-navy sm:text-3xl"
        >
          {d.title}
        </h2>
        <p className="mt-2 text-lg font-semibold text-gov-gray-700">
          {d.subtitle}
        </p>
      </header>

      <nav
        className="mt-6 rounded-lg border border-gov-gray-200 bg-gov-gray-50 p-4 sm:p-5"
        aria-labelledby="charter-toc-heading"
      >
        <p
          id="charter-toc-heading"
          className="font-heading text-sm font-bold text-gov-navy"
        >
          {tocTitle}
        </p>
        <ul className="mt-4 grid list-none gap-2 ps-0 text-sm sm:grid-cols-2 sm:gap-x-8">
          {tocItems.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="text-gov-navy underline-offset-2 transition-colors hover:text-gov-navy-deep hover:underline"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 space-y-0 text-base leading-relaxed text-gov-gray-700">
        <CharterBodySection
          headingId="charter-intro-heading"
          title={d.introduction.heading}
          isFirst
        >
          <p className="mt-3">{d.introduction.body}</p>
        </CharterBodySection>

        <CharterBodySection
          headingId="charter-vision-heading"
          title={d.vision.heading}
        >
          <p className="mt-3">{d.vision.text}</p>
        </CharterBodySection>

        <CharterBodySection
          headingId="charter-mission-heading"
          title={d.mission.heading}
        >
          <p className="mt-3">{d.mission.text}</p>
        </CharterBodySection>

        <CharterBodySection
          headingId="charter-values-heading"
          title={d.values.heading}
        >
          <ul className="mt-3 list-disc space-y-2 ps-6 leading-relaxed">
            {d.values.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CharterBodySection>

        <CharterBodySection
          headingId="charter-commitments-heading"
          title={d.officeCommitments.heading}
        >
          <p className="mt-3 font-medium text-gov-gray-700">
            {d.officeCommitments.intro}
          </p>
          <ol className="mt-3 list-decimal space-y-2 ps-6 leading-relaxed">
            {d.officeCommitments.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </CharterBodySection>

        <CharterBodySection
          headingId="charter-rights-heading"
          title={d.rights.heading}
        >
          <p className="mt-3 font-medium text-gov-gray-700">{d.rights.intro}</p>
          <ul className="mt-3 list-disc space-y-2 ps-6 leading-relaxed">
            {d.rights.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CharterBodySection>

        <CharterBodySection
          headingId="charter-duties-heading"
          title={d.duties.heading}
        >
          <p className="mt-3 font-medium text-gov-gray-700">{d.duties.intro}</p>
          <ol className="mt-3 list-decimal space-y-2 ps-6 leading-relaxed">
            {d.duties.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </CharterBodySection>

        <CharterBodySection
          headingId="charter-complaints-heading"
          title={d.complaints.heading}
        >
          <p className="mt-3">{d.complaints.intro}</p>
          <ul className="mt-3 list-disc space-y-2 ps-6 leading-relaxed">
            {d.complaints.channels.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-gov-gray-700">{d.complaints.responseWithin}</p>
        </CharterBodySection>

        <CharterBodySection
          headingId="charter-hours-heading"
          title={d.workingHours.heading}
        >
          <dl className="mt-4 grid gap-3 sm:max-w-xl sm:grid-cols-[minmax(0,auto)_1fr] sm:gap-x-6 sm:gap-y-3">
            <dt className="font-medium text-gov-navy">
              {d.workingHours.dailyFromLabel}
            </dt>
            <dd>{d.workingHours.from}</dd>
            <dt className="font-medium text-gov-navy">
              {d.workingHours.dailyToLabel}
            </dt>
            <dd>{d.workingHours.to}</dd>
            <dt className="font-medium text-gov-navy">
              {d.workingHours.exceptLabel}
            </dt>
            <dd>{d.workingHours.except}</dd>
          </dl>
          <p className="mt-4 rounded-lg border border-gov-gray-200 bg-gov-gray-50 p-4 font-medium text-gov-navy">
            {d.workingHours.note}
          </p>
        </CharterBodySection>
      </div>

      <footer className="mt-12 border-t border-gov-gray-200 pt-8 text-center">
        <p className="font-heading text-base font-semibold text-balance text-gov-navy sm:text-lg">
          {d.closing}
        </p>
      </footer>
    </article>
  );
}
