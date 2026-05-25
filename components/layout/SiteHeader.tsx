import { Suspense } from "react";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { LanguageSwitcherSkeleton } from "@/components/skeletons/LanguageSwitcherSkeleton";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { PublicHeaderSiteSearch } from "@/components/layout/PublicHeaderSiteSearch";
import { PublicNavLinks } from "@/components/layout/PublicNavLinks";
import { SiteHeaderMobileNav } from "@/components/layout/SiteHeaderMobileNav";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type SiteHeaderProps = {
  locale: Locale;
  messages: Messages;
};

export function SiteHeader({ locale, messages }: SiteHeaderProps) {
  const n = messages.nav;

  const navItems = [
    { href: "/", label: n.home },
    { href: "/international-traveler", label: n.international },
    { href: "/hajj-umrah", label: n.hajjUmrah },
    { href: "/citizen-services", label: n.citizen },
    { href: "/charter", label: n.charter },
  ] as const;

  return (
    <header className="app-topbar-glass sticky top-0 z-50 border-b border-white/35 bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-2 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4 md:flex-row md:items-center md:justify-between md:gap-4 md:pb-3">
        <div className="flex w-full min-w-0 items-center gap-2 md:hidden">
          <LocaleLink
            locale={locale}
            href="/"
            className="min-w-0 flex-1 text-start transition-opacity hover:opacity-90"
          >
            <span className="line-clamp-2 min-w-0 font-heading text-base font-bold leading-snug text-brand-primary text-balance sm:text-lg">
              {n.title}
            </span>
          </LocaleLink>
          <SiteHeaderMobileNav
            locale={locale}
            nav={n}
            items={navItems}
            myRequestsLabel={n.myRequests}
          />
        </div>

        <LocaleLink
          locale={locale}
          href="/"
          className="hidden min-w-0 max-w-[min(100%,26rem)] flex-col gap-0.5 text-start transition-opacity hover:opacity-90 md:flex"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-secondary md:truncate md:text-xs">
            {n.subtitle}
          </span>
          <span className="font-heading text-lg font-bold leading-snug text-brand-primary text-balance lg:text-xl">
            {n.title}
          </span>
        </LocaleLink>

        <div className="hidden min-w-0 flex-nowrap items-center justify-end gap-2 md:flex md:min-w-0 md:flex-1 lg:gap-3">
          <PublicNavLinks
            locale={locale}
            ariaLabel={n.aria}
            baseItems={navItems}
            myRequestsLabel={n.myRequests}
          />
          <PublicHeaderSiteSearch locale={locale} messages={messages} />
          <Suspense fallback={<LanguageSwitcherSkeleton variant="header" />}>
            <LanguageSwitcher locale={locale} nav={n} variant="landing" />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
