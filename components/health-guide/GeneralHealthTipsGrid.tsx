import { HealthGuideIcon } from "@/components/health-guide/HealthGuideIcon";
import type { Messages } from "@/lib/i18n/messages";

type GeneralHealthTipsGridProps = {
  content: Messages["healthGuides"]["generalTips"];
};

export function GeneralHealthTipsGrid({ content }: GeneralHealthTipsGridProps) {
  return (
    <section
      className="mx-auto max-w-6xl px-4 py-14"
      aria-labelledby="general-health-tips-heading"
    >
      <h2
        id="general-health-tips-heading"
        className="font-heading text-2xl font-bold text-gov-navy sm:text-3xl"
      >
        {content.heading}
      </h2>
      {content.intro ? (
        <p className="mt-3 max-w-3xl leading-relaxed text-gov-gray-700">
          {content.intro}
        </p>
      ) : null}

      <ul className="mt-8 grid grid-cols-2 gap-6 rounded-lg bg-gov-gray-50 p-6 md:grid-cols-3 md:gap-8 md:p-8 lg:grid-cols-5">
        {content.items.map((item) => (
          <li
            key={item.title}
            className="flex flex-col items-center gap-3 text-center"
          >
            <HealthGuideIcon id={item.icon} />
            <h3 className="font-heading text-sm font-bold text-gov-navy sm:text-base">
              {item.title}
            </h3>
            <p className="text-xs leading-relaxed text-gov-gray-700 sm:text-sm">
              {item.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
