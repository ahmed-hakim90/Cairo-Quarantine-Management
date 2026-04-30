"use client";

import { LocaleLink } from "@/components/i18n/LocaleLink";
import { locales, type Locale } from "@/lib/i18n/config";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

type SiteNavLinksProps = {
  locale: Locale;
  ariaLabel: string;
  items: readonly NavItem[];
};

const navLinkBase =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-1.5 py-2 text-[11px] leading-snug transition-[color,background-color,box-shadow,ring] sm:px-2 sm:text-xs md:px-3 md:text-sm min-h-10 sm:min-h-11";

const inactiveClass = `${navLinkBase} font-medium text-white/95 hover:bg-white/15`;

const activeClass = `${navLinkBase} bg-white font-semibold text-gov-navy shadow-md ring-2 ring-white/50 ring-offset-2 ring-offset-gov-navy`;

function normalizedPath(pathname: string): string {
  const pattern = new RegExp(`^\\/(${locales.join("|")})(?=\\/|$)`);
  const rest = pathname.replace(pattern, "") || "/";
  return rest.startsWith("/") ? rest : `/${rest}`;
}

function isActiveHref(normalized: string, href: string): boolean {
  if (href === "/") return normalized === "/";
  return normalized === href || normalized.startsWith(`${href}/`);
}

export function SiteNavLinks({ locale, ariaLabel, items }: SiteNavLinksProps) {
  const pathname = usePathname();
  const path = normalizedPath(pathname);

  return (
    <nav aria-label={ariaLabel} className="min-w-0">
      <ul className="flex flex-nowrap items-center justify-center gap-0.5 md:justify-end sm:gap-1 md:gap-1.5">
        {items.map(({ href, label }) => {
          const active = isActiveHref(path, href);
          return (
            <li key={href} className="shrink-0">
              <LocaleLink
                href={href}
                locale={locale}
                className={active ? activeClass : inactiveClass}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </LocaleLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
