"use client";

import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { SiteNavLinks } from "@/components/layout/SiteNavLinks";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { useEffect, useId, useRef, useState } from "react";

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
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogHeadingId = useId();
  const dialogId = useId();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
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

  return (
    <div className="flex shrink-0 items-center gap-1">
      <LanguageSwitcher locale={locale} nav={nav} />
      <button
        ref={menuButtonRef}
        type="button"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/10 text-white/95 transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-11"
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

      {open ? (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            className="fixed inset-0 z-[80] cursor-default bg-black/45"
            onClick={() => {
              setOpen(false);
              menuButtonRef.current?.focus();
            }}
          />
          <div
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogHeadingId}
            className="fixed inset-y-0 z-[90] flex w-[min(100%,20rem)] max-w-[100vw] flex-col border-e border-gov-gray-200 bg-white shadow-2xl start-0"
          >
            <div className="flex items-center justify-between gap-2 border-b border-gov-gray-200 px-4 py-3">
              <h2
                id={dialogHeadingId}
                className="font-heading text-lg font-bold leading-tight text-gov-navy"
              >
                {nav.mainMenuHeading}
              </h2>
              <button
                ref={closeBtnRef}
                type="button"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-gov-gray-700 transition-colors hover:bg-gov-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-navy"
                aria-label={nav.closeMenuAria}
                onClick={() => {
                  setOpen(false);
                  menuButtonRef.current?.focus();
                }}
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
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
              <SiteNavLinks
                locale={locale}
                ariaLabel={nav.aria}
                items={items}
                variant="drawer"
                onNavigate={() => {
                  setOpen(false);
                  menuButtonRef.current?.focus();
                }}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
