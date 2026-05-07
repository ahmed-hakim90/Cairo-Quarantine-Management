import type { TravelerVaccinationsOfficeCharter } from "@/data/traveler-vaccinations-office-charter";
import type { Locale } from "@/lib/i18n/config";

type TravelerVaccinationsCharterProps = {
  locale: Locale;
  document: TravelerVaccinationsOfficeCharter;
};

function articleLang(locale: Locale): string {
  if (locale === "zh") return "zh-CN";
  return locale;
}

function articleDir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function TravelerVaccinationsCharter({
  locale,
  document: d,
}: TravelerVaccinationsCharterProps) {
  return (
    <article
      lang={articleLang(locale)}
      dir={articleDir(locale)}
      className="mx-auto max-w-3xl rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <header className="border-b border-gov-gray-200 pb-6 text-center">
        <h2 className="font-heading text-2xl font-bold text-gov-navy sm:text-3xl">
          {d.title}
        </h2>
        <p className="mt-2 text-lg font-semibold text-gov-gray-700">
          {d.subtitle}
        </p>
      </header>

      <div className="mt-8 space-y-10 text-base leading-relaxed text-gov-gray-800">
        <section aria-labelledby="charter-intro-heading">
          <h3
            id="charter-intro-heading"
            className="font-heading text-xl font-bold text-gov-navy"
          >
            {d.introduction.heading}
          </h3>
          <p className="mt-3">{d.introduction.body}</p>
        </section>

        <section aria-labelledby="charter-vision-heading">
          <h3
            id="charter-vision-heading"
            className="font-heading text-xl font-bold text-gov-navy"
          >
            {d.vision.heading}
          </h3>
          <p className="mt-3">{d.vision.text}</p>
        </section>

        <section aria-labelledby="charter-mission-heading">
          <h3
            id="charter-mission-heading"
            className="font-heading text-xl font-bold text-gov-navy"
          >
            {d.mission.heading}
          </h3>
          <p className="mt-3">{d.mission.text}</p>
        </section>

        <section aria-labelledby="charter-values-heading">
          <h3
            id="charter-values-heading"
            className="font-heading text-xl font-bold text-gov-navy"
          >
            {d.values.heading}
          </h3>
          <ul className="mt-3 list-disc space-y-2 ps-6">
            {d.values.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="charter-commitments-heading">
          <h3
            id="charter-commitments-heading"
            className="font-heading text-xl font-bold text-gov-navy"
          >
            {d.officeCommitments.heading}
          </h3>
          <p className="mt-3 font-medium text-gov-gray-700">
            {d.officeCommitments.intro}
          </p>
          <ol className="mt-3 list-decimal space-y-2 ps-6">
            {d.officeCommitments.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="charter-rights-heading">
          <h3
            id="charter-rights-heading"
            className="font-heading text-xl font-bold text-gov-navy"
          >
            {d.rights.heading}
          </h3>
          <p className="mt-3 font-medium text-gov-gray-700">{d.rights.intro}</p>
          <ul className="mt-3 list-disc space-y-2 ps-6">
            {d.rights.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="charter-duties-heading">
          <h3
            id="charter-duties-heading"
            className="font-heading text-xl font-bold text-gov-navy"
          >
            {d.duties.heading}
          </h3>
          <p className="mt-3 font-medium text-gov-gray-700">{d.duties.intro}</p>
          <ol className="mt-3 list-decimal space-y-2 ps-6">
            {d.duties.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="charter-complaints-heading">
          <h3
            id="charter-complaints-heading"
            className="font-heading text-xl font-bold text-gov-navy"
          >
            {d.complaints.heading}
          </h3>
          <p className="mt-3">{d.complaints.intro}</p>
          <ul className="mt-3 list-disc space-y-2 ps-6">
            {d.complaints.channels.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-gov-gray-700">{d.complaints.responseWithin}</p>
        </section>

        <section aria-labelledby="charter-hours-heading">
          <h3
            id="charter-hours-heading"
            className="font-heading text-xl font-bold text-gov-navy"
          >
            {d.workingHours.heading}
          </h3>
          <ul className="mt-4 space-y-2">
            <li>
              <span className="font-medium text-gov-navy">
                {d.workingHours.dailyFromLabel}
              </span>{" "}
              {d.workingHours.from}
            </li>
            <li>
              <span className="font-medium text-gov-navy">
                {d.workingHours.dailyToLabel}
              </span>{" "}
              {d.workingHours.to}
            </li>
            <li>
              <span className="font-medium text-gov-navy">
                {d.workingHours.exceptLabel}
              </span>{" "}
              {d.workingHours.except}
            </li>
          </ul>
        </section>
      </div>

      <footer className="mt-10 border-t border-gov-gray-200 pt-6 text-center">
        <p className="font-heading text-lg font-bold text-gov-navy">
          {d.closing}
        </p>
      </footer>
    </article>
  );
}
