import { LocaleLink } from "@/components/i18n/LocaleLink";
import { TravelerStatCountUp } from "@/components/home/TravelerStatCountUp";
import {
  TRAVELER_STATS_COUNTS,
  TRAVELER_STATS_SOURCE_URL,
  type TravelerStatKey,
} from "@/data/traveler-stats";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

const ROWS: {
  key: TravelerStatKey;
  href: string;
  titleKey: "internationalTitle" | "hajjTitle" | "citizenTitle";
}[] = [
  {
    key: "international",
    href: "/international-traveler",
    titleKey: "internationalTitle",
  },
  { key: "hajjUmrah", href: "/hajj-umrah", titleKey: "hajjTitle" },
  { key: "citizen", href: "/citizen-services", titleKey: "citizenTitle" },
];

type TravelerStatsSectionProps = {
  locale: Locale;
  content: Messages["travelerStats"];
  serviceTitles: Pick<
    Messages["services"],
    "internationalTitle" | "hajjTitle" | "citizenTitle"
  >;
};

export function TravelerStatsSection({
  locale,
  content,
  serviceTitles,
}: TravelerStatsSectionProps) {
  return (
    <section
      className="border-y border-gov-gray-200 bg-gov-gray-50/80 py-14"
      aria-labelledby="traveler-stats-heading"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2
          id="traveler-stats-heading"
          className="font-heading text-2xl font-bold text-gov-navy sm:text-3xl"
        >
          {content.heading}
        </h2>
        <p className="mt-2 max-w-3xl text-gov-gray-600">{content.intro}</p>

        <ul
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-label={content.caption}
        >
          {ROWS.map((row) => {
            const count = TRAVELER_STATS_COUNTS[row.key];
            return (
              <li key={row.key}>
                <article className="flex h-full flex-col rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="font-heading text-lg font-bold text-gov-navy">
                    {serviceTitles[row.titleKey]}
                  </h3>
                  <p className="mt-4 font-mono text-4xl font-bold tabular-nums tracking-tight text-gov-navy sm:text-5xl">
                    {count === null ? (
                      <span className="text-2xl font-semibold text-gov-gray-500 sm:text-3xl">
                        {content.pendingValue}
                      </span>
                    ) : (
                      <TravelerStatCountUp value={count} locale={locale} />
                    )}
                  </p>
                  <LocaleLink
                    href={row.href}
                    locale={locale}
                    className="mt-6 text-sm font-semibold text-gov-accent underline decoration-gov-gray-300 underline-offset-2 hover:decoration-gov-navy"
                  >
                    {content.viewDetails}
                  </LocaleLink>
                </article>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-sm text-gov-gray-600">{content.footnote}</p>

        <p className="mt-2 text-sm text-gov-gray-600">
          <span className="font-medium text-gov-navy">{content.periodLabel}</span>
          {TRAVELER_STATS_SOURCE_URL ? (
            <>
              {" "}
              <a
                href={TRAVELER_STATS_SOURCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gov-accent underline decoration-gov-gray-300 underline-offset-2 hover:decoration-gov-navy"
              >
                {content.sourceLink}
              </a>
            </>
          ) : (
            <> {content.sourcePending}</>
          )}
        </p>
      </div>
    </section>
  );
}
