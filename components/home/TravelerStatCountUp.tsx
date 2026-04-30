"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";

type TravelerStatCountUpProps = {
  value: number;
  locale: Locale;
  durationMs?: number;
  className?: string;
};

function storageKey(locale: Locale, value: number): string {
  return `cairo-portal:travelerStatAnimated:${locale}:${value}`;
}

function intlLocale(locale: Locale): string {
  if (locale === "ar") return "ar-EG";
  if (locale === "zh") return "zh-CN";
  return "en-EG";
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function markAnimated(locale: Locale, value: number): void {
  try {
    sessionStorage.setItem(storageKey(locale, value), "1");
  } catch {
    /* private mode / quota */
  }
}

function hasAnimated(locale: Locale, value: number): boolean {
  try {
    return sessionStorage.getItem(storageKey(locale, value)) === "1";
  } catch {
    return false;
  }
}

export function TravelerStatCountUp({
  value,
  locale,
  durationMs = 2200,
  className,
}: TravelerStatCountUpProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const [display, setDisplay] = useState(0);

  const formatted = new Intl.NumberFormat(intlLocale(locale), {
    maximumFractionDigits: 0,
  }).format(Math.round(display));

  /** زائر عاد في نفس الجلسة: اعرض الرقم النهائي فورًا بدون انتظار السكرول */
  useEffect(() => {
    if (!hasAnimated(locale, value)) return;
    queueMicrotask(() => {
      setDisplay(value);
    });
  }, [locale, value]);

  /** أول زيارة: ابدأ العد عندما يظهر الرقم في الشاشة */
  useEffect(() => {
    if (hasAnimated(locale, value)) return;

    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.28, rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [locale, value]);

  useLayoutEffect(() => {
    if (!inView) return;
    if (hasAnimated(locale, value)) return;

    let cancelled = false;
    let rafRef = 0;

    const keyFinish = () => {
      markAnimated(locale, value);
    };

    const run = () => {
      if (cancelled) return;

      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduce || value === 0) {
        setDisplay(value);
        keyFinish();
        return;
      }

      setDisplay(0);
      const start = performance.now();

      const tick = (now: number) => {
        if (cancelled) return;
        const elapsed = now - start;
        const t = Math.min(1, elapsed / durationMs);
        setDisplay(easeOutCubic(t) * value);
        if (t < 1) {
          rafRef = requestAnimationFrame(tick);
        } else {
          setDisplay(value);
          keyFinish();
        }
      };

      rafRef = requestAnimationFrame(tick);
    };

    queueMicrotask(run);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef);
    };
  }, [inView, value, durationMs, locale]);

  return (
    <span ref={containerRef} className={className} aria-label={formatted}>
      {formatted}
    </span>
  );
}
