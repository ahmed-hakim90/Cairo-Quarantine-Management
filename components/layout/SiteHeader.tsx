import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type SiteHeaderProps = {
  locale: Locale;
  messages: Messages;
};

const navLinkClass =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-1.5 py-2 text-[11px] font-medium leading-snug text-white/95 transition-colors hover:bg-white/10 sm:px-2 sm:text-xs md:px-3 md:text-sm min-h-10 sm:min-h-11";

export function SiteHeader({ locale, messages }: SiteHeaderProps) {
  const n = messages.nav;

  const navItems = [
    { href: "/", label: n.home },
    { href: "/international-traveler", label: n.international },
    { href: "/hajj-umrah", label: n.hajjUmrah },
    { href: "/citizen-services", label: n.citizen },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-gov-gray-200 bg-gov-navy text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-2 sm:px-4 md:flex-row md:items-center md:justify-between md:gap-4 md:py-3">
        <LocaleLink
          locale={locale}
          href="/"
          className="flex flex-col gap-0.5 text-center transition-opacity hover:opacity-95 md:min-w-0 md:max-w-[min(100%,26rem)] md:text-start"
        >
          <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-gov-accent-muted opacity-90 md:block md:truncate md:text-xs">
            {n.subtitle}
          </span>
          <span className="font-heading text-base font-bold leading-snug text-balance sm:text-lg md:text-start md:text-lg lg:text-xl">
            {n.title}
          </span>
        </LocaleLink>

        <div className="flex min-w-0 flex-nowrap items-center justify-center gap-1 border-t border-white/15 pt-2 sm:gap-2 md:min-w-0 md:flex-1 md:justify-end md:border-t-0 md:pt-0 md:gap-2 lg:gap-3">
          <nav aria-label={n.aria} className="min-w-0">
            <ul className="flex flex-nowrap items-center justify-center gap-0.5 md:justify-end sm:gap-1 md:gap-1.5">
              {navItems.map(({ href, label }) => (
                <li key={href} className="shrink-0">
                  <LocaleLink
                    href={href}
                    locale={locale}
                    className={navLinkClass}
                  >
                    {label}
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </nav>
          <LanguageSwitcher locale={locale} nav={n} />
        </div>
      </div>
    </header>
  );
}
