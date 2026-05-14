"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { locales, type Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type LanguageSwitcherProps = {
  locale: Locale;
  nav: Messages["nav"];
};

const flagForLocale: Record<Locale, string> = {
  ar: "🇪🇬",
  en: "🇬🇧",
  zh: "🇨🇳",
};

const codeForLocale: Record<Locale, string> = {
  ar: "AR",
  en: "EN",
  zh: "ZH",
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

export function LanguageSwitcher({ locale, nav }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useId();

  const pattern = new RegExp(`^\\/(${locales.join("|")})(?=\\/|$)`);
  const rest = pathname.replace(pattern, "") || "/";
  const normalized = rest.startsWith("/") ? rest : `/${rest}`;
  const alternatives = locales.filter((l) => l !== locale);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={nav.switchLangAria}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-white/25 bg-white/10 px-2 text-sm font-medium leading-none text-white/95 transition-colors hover:bg-white/20 min-h-10 sm:min-h-11 sm:px-3"
      >
        <span aria-hidden="true" className="text-base leading-none">
          {flagForLocale[locale]}
        </span>
        <span className="hidden text-xs font-semibold tracking-wide sm:inline">
          {codeForLocale[locale]}
        </span>
        <svg
          aria-hidden="true"
          width="10"
          height="6"
          viewBox="0 0 10 6"
          className={`opacity-80 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={menuId}
          role="menu"
          aria-label={nav.switchLangAria}
          className="absolute end-0 top-full z-50 mt-1 min-w-[10rem] overflow-hidden rounded-md border border-gov-gray-200 bg-white py-1 text-sm text-gov-gray-900 shadow-lg ring-1 ring-black/5"
        >
          {alternatives.map((target) => {
            const href =
              normalized === "/" ? `/${target}` : `/${target}${normalized}`;
            const hl = hrefLangForLocale[target];
            return (
              <li key={target} role="none">
                <Link
                  href={href}
                  hrefLang={hl}
                  lang={hl}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-gov-gray-100 focus:bg-gov-gray-100 focus:outline-none"
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    {flagForLocale[target]}
                  </span>
                  <span className="font-medium">{navLabel(nav, target)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
