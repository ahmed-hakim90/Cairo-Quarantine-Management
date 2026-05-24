import { Suspense, type ReactNode } from "react";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { LanguageSwitcherSkeleton } from "@/components/skeletons/LanguageSwitcherSkeleton";
import { SplashPlaneIcon } from "@/components/splash/SplashPlaneIcon";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type AdminAuthShellProps = {
  locale: Locale;
  messages: Messages;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AdminAuthShell({
  locale,
  messages,
  title,
  subtitle,
  children,
  footer,
}: AdminAuthShellProps) {
  const { meta, nav, admin } = messages;

  return (
    <div className="flex min-h-screen flex-col bg-brand-gray-50">
      <header className="border-b border-brand-gray-200 bg-brand-primary-deep text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            {nav.subtitle.trim() ? (
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-brand-accent-muted opacity-90 sm:text-xs">
                {nav.subtitle}
              </p>
            ) : null}
            <p className="font-heading text-base font-bold leading-snug text-balance sm:text-lg">
              {meta.siteName}
            </p>
          </div>
          <Suspense fallback={<LanguageSwitcherSkeleton variant="header" />}>
            <LanguageSwitcher locale={locale} nav={nav} />
          </Suspense>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="glass-panel w-full max-w-md rounded-xl p-5 md:p-7">
          <div className="mb-6 flex flex-col items-center text-center">
            <SplashPlaneIcon className="h-14 w-14 text-brand-accent sm:h-16 sm:w-16" />
            <h1 className="mt-4 font-heading text-xl font-extrabold text-brand-primary">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-sm leading-relaxed text-brand-gray-600">
                {subtitle}
              </p>
            ) : null}
          </div>

          {children}

          {footer ?? (
            <p className="mt-6 border-t border-brand-gray-100 pt-5 text-center">
              <LocaleLink
                locale={locale}
                href="/"
                className="text-sm font-bold text-brand-accent transition hover:text-brand-primary"
              >
                {admin.auth.backToPortal}
              </LocaleLink>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
