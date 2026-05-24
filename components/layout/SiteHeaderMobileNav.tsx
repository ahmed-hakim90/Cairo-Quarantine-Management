"use client";

import { Suspense, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { LanguageSwitcherSkeleton } from "@/components/skeletons/LanguageSwitcherSkeleton";
import { SiteNavLinks } from "@/components/layout/SiteNavLinks";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { lockDocumentScroll } from "@/lib/ui/scroll-lock";

type NavItem = { href: string; label: string };

type SiteHeaderMobileNavProps = {
  locale: Locale;
  nav: Messages["nav"];
  items: readonly NavItem[];
};

export function SiteHeaderMobileNav({
  locale,
  nav,
  items,
}: SiteHeaderMobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogHeadingId = useId();
  const dialogId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      document.body.removeAttribute("data-mobile-nav-open");
      return;
    }

    document.body.setAttribute("data-mobile-nav-open", "");
    return lockDocumentScroll();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  function closeDrawer() {
    setOpen(false);
    menuButtonRef.current?.focus();
  }

  const drawer =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] md:hidden"
            role="presentation"
          >
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px] touch-none"
              onClick={closeDrawer}
            />
            <aside
              id={dialogId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogHeadingId}
              className="absolute top-0 bottom-0 start-0 flex h-[100dvh] max-h-[100dvh] w-[min(100%,20rem)] max-w-[85vw] flex-col bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-brand-gray-200 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <h2
                  id={dialogHeadingId}
                  className="min-w-0 flex-1 font-heading text-lg font-bold leading-tight text-brand-primary"
                >
                  {nav.mainMenuHeading}
                </h2>
                <button
                  ref={closeBtnRef}
                  type="button"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-brand-gray-200 text-brand-gray-700 transition-colors hover:bg-brand-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
                  aria-label={nav.closeMenuAria}
                  onClick={closeDrawer}
                >
                  <svg
                    aria-hidden="true"
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                  >
                    <path
                      d="M5 5l12 12M17 5L5 17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <SiteNavLinks
                  locale={locale}
                  ariaLabel={nav.aria}
                  items={items}
                  variant="drawer"
                  onNavigate={closeDrawer}
                />
              </div>
            </aside>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Suspense fallback={<LanguageSwitcherSkeleton variant="mobile" />}>
        <LanguageSwitcher locale={locale} nav={nav} variant="landing" />
      </Suspense>
      <button
        ref={menuButtonRef}
        type="button"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-brand-primary/20 bg-brand-primary/5 text-brand-primary transition-colors hover:bg-brand-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent sm:size-11"
        aria-expanded={open}
        aria-controls={dialogId}
        aria-haspopup="dialog"
        aria-label={open ? nav.closeMenuAria : nav.openMenuAria}
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 22 22"
          className="shrink-0"
        >
          <path
            d="M4 6h14M4 11h14M4 16h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {drawer}
    </div>
  );
}
