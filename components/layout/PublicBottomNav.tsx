"use client";

import { useState, type ReactNode } from "react";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import {
  PublicSiteSearch,
  PublicSiteSearchTrigger,
} from "@/components/layout/PublicSiteSearch";
import { normalizedNavPath } from "@/components/layout/SiteNavLinks";
import { useHasStoredRequests } from "@/lib/hooks/use-has-stored-requests";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { usePathname } from "next/navigation";

type PublicBottomNavProps = {
  locale: Locale;
  messages: Messages;
};

const BOTTOM_NAV_ITEM_CLASS =
  "flex min-h-8 w-full flex-col items-center justify-center gap-0.5 px-0.5 py-0.5 text-[10px] font-semibold leading-tight transition-colors sm:text-[11px]";

function bottomNavLabelClass(active: boolean) {
  return active ? "text-brand-primary" : "text-brand-primary/50";
}

function iconClass(active: boolean) {
  return active ? "text-brand-primary" : "text-brand-primary/45";
}

function BottomNavSlot({ children }: { children: ReactNode }) {
  return (
    <li className="flex min-w-0 items-end justify-center">{children}</li>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-6 ${iconClass(active)}`}
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

function MyRequestsIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-6 ${iconClass(active)}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function CharterIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-6 ${iconClass(active)}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h6" />
    </svg>
  );
}

function isHome(path: string): boolean {
  return path === "/";
}

function isBooking(path: string): boolean {
  return path === "/booking" || path.startsWith("/booking/");
}

function isMyRequests(path: string): boolean {
  return path === "/my-requests" || path.startsWith("/my-requests/");
}

function isCharter(path: string): boolean {
  return path === "/charter" || path.startsWith("/charter/");
}

type SideNavLinkProps = {
  locale: Locale;
  href: string;
  label: string;
  ariaLabel: string;
  active: boolean;
  icon: ReactNode;
};

function SideNavLink({
  locale,
  href,
  label,
  ariaLabel,
  active,
  icon,
}: SideNavLinkProps) {
  return (
    <LocaleLink
      locale={locale}
      href={href}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={`${BOTTOM_NAV_ITEM_CLASS} ${bottomNavLabelClass(active)}`}
    >
      {icon}
      <span className="max-w-[3.5rem] truncate text-center">{label}</span>
    </LocaleLink>
  );
}

/** Keeps booking FAB centered when «طلباتي» is hidden. */
function BottomNavSpacer() {
  return (
    <span
      aria-hidden
      className={`${BOTTOM_NAV_ITEM_CLASS} pointer-events-none invisible`}
    >
      <span className="size-6" />
      <span className="max-w-[3.5rem] truncate text-center opacity-0">.</span>
    </span>
  );
}

export function PublicBottomNav({ locale, messages }: PublicBottomNavProps) {
  const pathname = usePathname();
  const path = normalizedNavPath(pathname);
  const n = messages.nav;
  const b = messages.bottomNav;
  const hasStored = useHasStoredRequests();
  const [searchOpen, setSearchOpen] = useState(false);

  const homeActive = isHome(path);
  const bookingActive = isBooking(path);
  const myRequestsActive = isMyRequests(path);
  const charterActive = isCharter(path);

  return (
    <>
      <nav
        className="public-bottom-nav app-bottom-nav-bar fixed inset-x-0 bottom-0 z-40 border-t border-brand-gray-200 bg-white pt-4 shadow-[0_-4px_16px_rgb(11_74_139/0.08)] md:hidden"
        aria-label={b.aria}
      >
        <ul className="mx-auto grid w-full max-w-lg grid-cols-5 items-end gap-0 px-2 pb-[max(0.375rem,env(safe-area-inset-bottom,0px))] pt-0.5">
          <BottomNavSlot>
            <SideNavLink
              locale={locale}
              href="/"
              label={n.home}
              ariaLabel={n.home}
              active={homeActive}
              icon={<HomeIcon active={homeActive} />}
            />
          </BottomNavSlot>

          <BottomNavSlot>
            {hasStored ? (
              <SideNavLink
                locale={locale}
                href="/my-requests"
                label={n.myRequests}
                ariaLabel={n.myRequests}
                active={myRequestsActive}
                icon={<MyRequestsIcon active={myRequestsActive} />}
              />
            ) : (
              <BottomNavSpacer />
            )}
          </BottomNavSlot>

          <BottomNavSlot>
            <LocaleLink
              locale={locale}
              href="/booking"
              aria-label={n.bookVaccinationAria}
              aria-current={bookingActive ? "page" : undefined}
              className="-mt-10 flex w-full min-h-8 flex-col items-center gap-0.5"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-primary-deep shadow-lg shadow-brand-primary/25 ring-4 ring-white transition-transform active:scale-95">
                <BookingIcon />
              </span>
              <span
                className={`max-w-[3.5rem] truncate text-center text-[10px] font-bold leading-tight sm:text-[11px] ${
                  bookingActive ? "text-brand-primary" : "text-brand-primary/70"
                }`}
              >
                {b.booking}
              </span>
            </LocaleLink>
          </BottomNavSlot>

          <BottomNavSlot>
            <SideNavLink
              locale={locale}
              href="/charter"
              label={b.charter}
              ariaLabel={n.charter.trim()}
              active={charterActive}
              icon={<CharterIcon active={charterActive} />}
            />
          </BottomNavSlot>

          <BottomNavSlot>
            <PublicSiteSearchTrigger
              labels={b}
              onClick={() => setSearchOpen(true)}
              className={`${BOTTOM_NAV_ITEM_CLASS} ${bottomNavLabelClass(false)}`}
            />
          </BottomNavSlot>
        </ul>
      </nav>
      <PublicSiteSearch
        locale={locale}
        labels={b}
        nav={n}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </>
  );
}
