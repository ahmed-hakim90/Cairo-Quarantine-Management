import { LocaleLink } from "@/components/i18n/LocaleLink";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type CardDef = {
  href: string;
  titleKey: "internationalTitle" | "hajjTitle" | "citizenTitle";
  descKey: "internationalDesc" | "hajjDesc" | "citizenDesc";
  icon: React.ReactNode;
};

function IconGlobe() {
  return (
    <svg
      className="h-10 w-10 text-gov-accent"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  );
}

function IconKaaba() {
  return (
    <svg
      className="h-10 w-10 text-gov-accent"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 2.18 5.5 2.75v7.74L12 19.82l-5.5-2.75V7.93L12 5.18ZM11 9v6h2V9h-2Z" />
    </svg>
  );
}

function IconCitizen() {
  return (
    <svg
      className="h-10 w-10 text-gov-accent"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

const CARD_DEFS: CardDef[] = [
  {
    href: "/international-traveler",
    titleKey: "internationalTitle",
    descKey: "internationalDesc",
    icon: <IconGlobe />,
  },
  {
    href: "/hajj-umrah",
    titleKey: "hajjTitle",
    descKey: "hajjDesc",
    icon: <IconKaaba />,
  },
  {
    href: "/citizen-services",
    titleKey: "citizenTitle",
    descKey: "citizenDesc",
    icon: <IconCitizen />,
  },
];

type ServiceCardsProps = {
  locale: Locale;
  content: Messages["services"];
};

export function ServiceCards({ locale, content }: ServiceCardsProps) {
  return (
    <section
      className="mx-auto max-w-6xl px-4 py-14"
      aria-labelledby="services-heading"
    >
      <h2
        id="services-heading"
        className="font-heading text-2xl font-bold text-gov-navy sm:text-3xl"
      >
        {content.heading}
      </h2>
      <p className="mt-2 max-w-2xl text-gov-gray-600">{content.intro}</p>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CARD_DEFS.map((card) => (
          <li key={card.href}>
            <LocaleLink
              href={card.href}
              locale={locale}
              className="group flex h-full min-h-[180px] flex-col rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm transition-shadow hover:border-gov-accent/40 hover:shadow-md"
            >
              <span className="mb-4 inline-flex rounded-md bg-gov-gray-50 p-3 ring-1 ring-gov-gray-100 transition-colors group-hover:bg-gov-accent-muted/40">
                {card.icon}
              </span>
              <span className="font-heading text-xl font-bold text-gov-navy">
                {content[card.titleKey]}
              </span>
              <span className="mt-2 flex-1 text-sm leading-relaxed text-gov-gray-600">
                {content[card.descKey]}
              </span>
              <span className="mt-4 text-sm font-semibold text-gov-accent">
                {content.viewDetails}
              </span>
            </LocaleLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
