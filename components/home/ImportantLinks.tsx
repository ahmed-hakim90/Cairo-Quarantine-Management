import { LocaleLink } from "@/components/i18n/LocaleLink";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

/** الوقاية من لدغات البعوض والأمراض المنقولة عن طريقها — Google Drive viewer */
const MOSQUITO_VECTOR_PREVENTION_PDF =
  "https://drive.google.com/file/d/1qKIHIwnhFVEptL5KyQMjf0s4pBCdk5If/view";

const outlineLinkClass =
  "flex min-h-14 items-center justify-center rounded-md border-2 border-gov-navy bg-white px-6 py-4 text-center text-base font-semibold text-gov-navy transition-colors hover:bg-gov-gray-50";

type ImportantLinksProps = {
  locale: Locale;
  content: Messages["importantLinks"];
};

export function ImportantLinks({ locale, content }: ImportantLinksProps) {
  return (
    <section
      className="mx-auto max-w-6xl px-4 py-14"
      aria-labelledby="links-heading"
    >
      <h2
        id="links-heading"
        className="font-heading text-2xl font-bold text-gov-navy sm:text-3xl"
      >
        {content.heading}
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <a
          href="/documents/health-guide.pdf"
          className="flex min-h-14 items-center justify-center rounded-md border border-gov-navy bg-gov-navy px-6 py-4 text-center text-base font-semibold text-white transition-colors hover:bg-gov-navy-deep"
          target="_blank"
          rel="noopener noreferrer"
        >
          {content.pdf}
        </a>
        <LocaleLink
          locale={locale}
          href="/hajj-umrah#vaccination-guide"
          className={outlineLinkClass}
        >
          {content.hajjInstructions}
        </LocaleLink>
        <a
          href={MOSQUITO_VECTOR_PREVENTION_PDF}
          className={outlineLinkClass}
          target="_blank"
          rel="noopener noreferrer"
        >
          {content.mosquitoPrevention}
        </a>
      </div>
    </section>
  );
}
