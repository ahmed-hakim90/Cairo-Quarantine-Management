import { Suspense } from "react";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { LanguageSwitcherSkeleton } from "@/components/skeletons/LanguageSwitcherSkeleton";
import { PublicHeaderSiteSearch } from "@/components/layout/PublicHeaderSiteSearch";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type LandingTopBarProps = {
  locale: Locale;
  messages: Messages;
};

export function LandingTopBar({ locale, messages }: LandingTopBarProps) {
  const landing = messages.landing;

  return (
    <header className="app-topbar-glass fixed top-0 z-50 w-full border-b border-white/35 bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <LocaleLink
          locale={locale}
          href="/"
          className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <Image
            src="/icons/icon-192.png"
            alt={landing.topBar.logoAlt}
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg shadow-sm"
          />
          <span className="line-clamp-2 font-heading text-sm font-bold leading-snug text-landing-primary sm:text-base">
            {landing.topBar.platformName}
          </span>
        </LocaleLink>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden md:block">
            <PublicHeaderSiteSearch locale={locale} messages={messages} />
          </div>
          <Suspense fallback={<LanguageSwitcherSkeleton variant="header" />}>
            <LanguageSwitcher
              locale={locale}
              nav={messages.nav}
              variant="landing"
            />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
