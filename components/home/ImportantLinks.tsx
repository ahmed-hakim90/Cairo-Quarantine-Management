import type { Messages } from "@/lib/i18n/messages";

/** الدليل الصحي للمسافرين 2025 — Google Drive viewer */
const TRAVELER_HEALTH_GUIDE_PDF =
  "https://drive.google.com/file/d/1epuzf4LWH8XNS_zpBb7UwXEMdRztPR7S/view";

/** الإرشادات الصحية لأداء مناسك الحج — Google Drive viewer */
const HAJJ_UMRAH_INSTRUCTIONS_PDF =
  "https://drive.google.com/file/d/1iYO2zem5h2zWP1g4uxfwpGgPZlJsgXHU/view";

/** الوقاية من لدغات البعوض والأمراض المنقولة عن طريقها — Google Drive viewer */
const MOSQUITO_VECTOR_PREVENTION_PDF =
  "https://drive.google.com/file/d/1qKIHIwnhFVEptL5KyQMjf0s4pBCdk5If/view";

const primaryLinkClass =
  "flex min-h-14 items-center justify-center rounded-md border border-gov-navy bg-gov-navy px-6 py-4 text-center text-base font-semibold text-white transition-colors hover:bg-gov-navy-deep";

const outlineLinkClass =
  "flex min-h-14 items-center justify-center rounded-md border-2 border-gov-navy bg-white px-6 py-4 text-center text-base font-semibold text-gov-navy transition-colors hover:bg-gov-gray-50";

type ImportantLinksProps = {
  content: Messages["importantLinks"];
};

export function ImportantLinks({ content }: ImportantLinksProps) {
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
          href={TRAVELER_HEALTH_GUIDE_PDF}
          className={primaryLinkClass}
          target="_blank"
          rel="noopener noreferrer"
        >
          {content.pdf}
        </a>
        <a
          href={HAJJ_UMRAH_INSTRUCTIONS_PDF}
          className={outlineLinkClass}
          target="_blank"
          rel="noopener noreferrer"
        >
          {content.hajjInstructions}
        </a>
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
