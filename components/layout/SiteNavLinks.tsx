"use client";

import { LocaleLink } from "@/components/i18n/LocaleLink";
import { locales, type Locale } from "@/lib/i18n/config";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

export type SiteNavVariant = "bar" | "drawer";

type SiteNavLinksProps = {
  locale: Locale;
  ariaLabel: string;
  items: readonly NavItem[];
  variant?: SiteNavVariant;
  onNavigate?: () => void;
};

const navLinkBaseBar =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-1.5 py-2 text-[11px] leading-snug transition-[color,background-color,box-shadow,ring] sm:px-2 sm:text-xs md:px-3 md:text-sm min-h-10 sm:min-h-11";

const inactiveClassBar = `${navLinkBaseBar} font-medium text-white/95 hover:bg-white/15`;

const activeClassBar = `${navLinkBaseBar} bg-white font-semibold text-gov-navy shadow-md ring-2 ring-white/50 ring-offset-2 ring-offset-gov-navy`;

const navLinkBaseDrawer =
  "flex w-full items-center rounded-md px-4 py-3 text-base font-medium leading-snug transition-[color,background-color] min-h-12";

const inactiveClassDrawer = `${navLinkBaseDrawer} text-gov-gray-900 hover:bg-gov-gray-100`;

const activeClassDrawer = `${navLinkBaseDrawer} bg-gov-navy font-semibold text-white shadow-sm`;

export function normalizedNavPath(pathname: string): string {
  const pattern = new RegExp(`^\\/(${locales.join("|")})(?=\\/|$)`);
  const rest = pathname.replace(pattern, "") || "/";
  return rest.startsWith("/") ? rest : `/${rest}`;
}

function isActiveHref(normalized: string, href: string): boolean {
  if (href === "/") return normalized === "/";
  return normalized === href || normalized.startsWith(`${href}/`);
}

export function SiteNavLinks({
  locale,
  ariaLabel,
  items,
  variant = "bar",
  onNavigate,
}: SiteNavLinksProps) {
  const pathname = usePathname();
  const path = normalizedNavPath(pathname);

  if (variant === "drawer") {
    return (
      <nav aria-label={ariaLabel}>
        <ul className="flex flex-col gap-1">
          {items.map(({ href, label }) => {
            const active = isActiveHref(path, href);
            return (
              <li key={href}>
                <LocaleLink
                  href={href}
                  locale={locale}
                  className={active ? activeClassDrawer : inactiveClassDrawer}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
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

  return (
    <nav aria-label={ariaLabel} className="min-w-0">
      <ul className="flex flex-nowrap items-center justify-center gap-0.5 sm:gap-1 md:justify-end md:gap-1.5">
        {items.map(({ href, label }) => {
          const active = isActiveHref(path, href);
          return (
            <li key={href} className="shrink-0">
              <LocaleLink
                href={href}
                locale={locale}
                className={active ? activeClassBar : inactiveClassBar}
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
