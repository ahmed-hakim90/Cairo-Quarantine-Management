"use client";

import type { ReactNode } from "react";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { normalizedNavPath } from "@/components/layout/SiteNavLinks";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { usePathname } from "next/navigation";

type PublicBottomNavProps = {
  locale: Locale;
  messages: Messages;
};

type NavItem = {
  kind: "link";
  href: string;
  label: string;
  ariaLabel: string;
  match: (path: string) => boolean;
  icon: (active: boolean) => ReactNode;
  prominent?: boolean;
};

type BottomNavItem = NavItem;

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-6 ${active ? "text-brand-primary" : "text-brand-primary/45"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

function AboutPlatformIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-6 ${active ? "text-brand-primary" : "text-brand-primary/45"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function BookingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-7 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function RequestsIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-6 ${active ? "text-brand-primary" : "text-brand-primary/45"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14h6M9 18h4" />
    </svg>
  );
}

function isHome(path: string): boolean {
  return path === "/";
}

function isAboutPlatform(path: string): boolean {
  return path === "/welcome" || path.startsWith("/welcome/");
}

function isBooking(path: string): boolean {
  return path === "/booking" || path.startsWith("/booking/");
}

function isMyRequests(path: string): boolean {
  return path === "/my-requests" || path.startsWith("/my-requests/");
}

export function PublicBottomNav({ locale, messages }: PublicBottomNavProps) {
  const pathname = usePathname();
  const path = normalizedNavPath(pathname);
  const n = messages.nav;
  const b = messages.bottomNav;

  const items: BottomNavItem[] = [
    {
      kind: "link",
      href: "/",
      label: n.home,
      ariaLabel: n.home,
      match: isHome,
      icon: (active) => <HomeIcon active={active} />,
    },
    {
      kind: "link",
      href: "/welcome",
      label: n.aboutPlatform,
      ariaLabel: n.aboutPlatform,
      match: isAboutPlatform,
      icon: (active) => <AboutPlatformIcon active={active} />,
    },
    {
      kind: "link",
      href: "/booking",
      label: b.booking,
      ariaLabel: n.bookVaccinationAria,
      match: isBooking,
      prominent: true,
      icon: () => <BookingIcon />,
    },
    {
      kind: "link",
      href: "/my-requests",
      label: n.myRequests,
      ariaLabel: n.myRequests,
      match: isMyRequests,
      icon: (active) => <RequestsIcon active={active} />,
    },
  ];

  const colCount = items.length;

  return (
    <nav
      className="public-bottom-nav app-bottom-nav-bar fixed inset-x-0 bottom-0 z-50 pt-4 md:hidden"
      aria-label={b.aria}
    >
      <ul
        className="mx-auto grid max-w-lg items-end px-1 pb-[max(0.375rem,env(safe-area-inset-bottom,0px))] pt-0.5"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = item.match(path);

          if (item.prominent) {
            return (
              <li key={item.href} className="flex justify-center">
                <LocaleLink
                  locale={locale}
                  href={item.href}
                  aria-label={item.ariaLabel}
                  aria-current={active ? "page" : undefined}
                  className="-mt-10 flex min-h-8 flex-col items-center gap-0.5"
                >
                  <span className="flex size-14 items-center justify-center rounded-full bg-brand-primary-deep shadow-lg shadow-brand-primary/25 ring-4 ring-white transition-transform active:scale-95">
                    {item.icon(active)}
                  </span>
                  <span
                    className={`max-w-[4.5rem] truncate text-center text-[10px] font-bold leading-tight ${
                      active ? "text-brand-primary" : "text-brand-primary/70"
                    }`}
                  >
                    {item.label}
                  </span>
                </LocaleLink>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <LocaleLink
                locale={locale}
                href={item.href}
                aria-label={item.ariaLabel}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-8 flex-col items-center justify-center gap-0.5 px-1 py-0.5 text-[10px] font-semibold leading-tight transition-colors sm:text-[11px] ${
                  active ? "text-brand-primary" : "text-brand-primary/50"
                }`}
              >
                {item.icon(active)}
                <span className="max-w-[4.25rem] truncate text-center">{item.label}</span>
              </LocaleLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
