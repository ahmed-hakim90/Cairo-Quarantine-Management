import { HealthGuideIcon } from "@/components/health-guide/HealthGuideIcon";
import type { Messages } from "@/lib/i18n/messages";

type HajjVaccinationGuideProps = {
  content: Messages["healthGuides"]["vaccination"];
};

export function HajjVaccinationGuide({ content }: HajjVaccinationGuideProps) {
  return (
    <section
      id="vaccination-guide"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14"
      aria-labelledby="vaccination-guide-heading"
    >
      <header className="rounded-lg border border-gov-gray-200 bg-gov-accent-muted/40 px-6 py-8 text-center md:px-10">
        <h2
          id="vaccination-guide-heading"
          className="font-heading text-2xl font-bold text-gov-navy sm:text-3xl"
        >
          {content.title}
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-gov-gray-700">
          {content.subtitle}
        </p>
      </header>

      <div className="mt-10 space-y-10">
        {content.sections.map((section) => (
          <article
            key={section.heading}
            className="overflow-hidden rounded-lg border border-gov-gray-200 bg-white shadow-sm"
          >
            <h3 className="bg-gov-navy px-4 py-3 text-center text-base font-bold text-white sm:text-lg">
              {section.heading}
            </h3>
            <ul className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
              {section.items.map((item) => (
                <li
                  key={item.body}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <HealthGuideIcon id={item.icon} />
                  <p className="text-sm leading-relaxed text-gov-gray-700 sm:text-base">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <footer className="mt-10 space-y-2 text-center">
        <p className="font-heading text-lg font-bold text-gov-navy">
          {content.footer.primary}
        </p>
        <p className="text-base text-gov-gray-700">{content.footer.secondary}</p>
      </footer>
    </section>
  );
}
