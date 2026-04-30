"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type LanguageSwitcherProps = {
  locale: Locale;
  nav: Messages["nav"];
};

const hrefLangForLocale: Record<Locale, string> = {
  ar: "ar",
  en: "en",
  zh: "zh-CN",
};

function navLabel(nav: Messages["nav"], target: Locale): string {
  if (target === "ar") return nav.switchToAr;
  if (target === "en") return nav.switchToEn;
  return nav.switchToZh;
}

const linkClass =
  "inline-flex shrink-0 items-center rounded-md border border-white/25 bg-white/10 px-2 py-2 text-[11px] font-medium leading-snug text-white/95 transition-colors hover:bg-white/20 min-h-10 sm:min-h-11 sm:px-3 sm:text-sm";

export function LanguageSwitcher({ locale, nav }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const pattern = new RegExp(`^\\/(${locales.join("|")})(?=\\/|$)`);
  const rest = pathname.replace(pattern, "") || "/";
  const normalized = rest.startsWith("/") ? rest : `/${rest}`;
  const alternatives = locales.filter((l) => l !== locale);

  return (
    <div
      role="navigation"
      aria-label={nav.switchLangAria}
      className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2"
    >
      {alternatives.map((target) => {
        const href =
          normalized === "/" ? `/${target}` : `/${target}${normalized}`;
        const hl = hrefLangForLocale[target];
        return (
          <Link
            key={target}
            href={href}
            hrefLang={hl}
            lang={hl}
            className={linkClass}
            aria-label={`${nav.switchLangAria}: ${navLabel(nav, target)}`}
          >
            {navLabel(nav, target)}
          </Link>
        );
      })}
    </div>
  );
}
