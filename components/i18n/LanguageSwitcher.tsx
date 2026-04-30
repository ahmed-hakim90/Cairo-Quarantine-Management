"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type LanguageSwitcherProps = {
  locale: Locale;
  nav: Messages["nav"];
};

export function LanguageSwitcher({ locale, nav }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const rest =
    pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  const normalized = rest.startsWith("/") ? rest : `/${rest}`;
  const other: Locale = locale === "ar" ? "en" : "ar";
  const href =
    normalized === "/"
      ? `/${other}`
      : `/${other}${normalized}`;

  const label = locale === "ar" ? nav.switchToEn : nav.switchToAr;

  return (
    <Link
      href={href}
      hrefLang={other === "ar" ? "ar" : "en"}
      lang={other === "ar" ? "ar" : "en"}
      className="inline-flex shrink-0 items-center rounded-md border border-white/25 bg-white/10 px-2 py-2 text-[11px] font-medium leading-snug text-white/95 transition-colors hover:bg-white/20 min-h-10 sm:min-h-11 sm:px-3 sm:text-sm"
      aria-label={nav.switchLangAria}
    >
      {label}
    </Link>
  );
}
