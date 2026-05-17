"use client";

import { useEffect, useState } from "react";
import { TravelerStatCountUp } from "@/components/home/TravelerStatCountUp";
import {
  SITE_VISITOR_MIN_DISPLAY,
  formatSiteVisitorDisplay,
} from "@/lib/site-stats/display";
import type { Locale } from "@/lib/i18n/config";

const SESSION_KEY = "cairo-portal:siteVisitorCounted";

type SiteVisitorStatCardProps = {
  locale: Locale;
  title: string;
  initialCount: number;
};

function hasSessionCounted(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markSessionCounted(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}

export function SiteVisitorStatCard({
  locale,
  title,
  initialCount,
}: SiteVisitorStatCardProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (hasSessionCounted()) return;

    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch("/api/site-visitors", { method: "POST" });
        if (!res.ok) return;
        const data = (await res.json()) as { total?: number };
        if (cancelled) return;
        if (typeof data.total === "number" && data.total >= 0) {
          setCount(data.total);
        }
        markSessionCounted();
      } catch {
        /* network */
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayLabel = formatSiteVisitorDisplay(count, locale);
  const animateValue = Math.max(count, SITE_VISITOR_MIN_DISPLAY);

  return (
    <article className="flex h-full flex-col rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-heading text-lg font-bold text-gov-navy">{title}</h3>
      <p
        className="mt-4 font-mono text-4xl font-bold tabular-nums tracking-tight text-gov-navy sm:text-5xl"
        aria-label={displayLabel}
      >
        <TravelerStatCountUp
          value={animateValue}
          locale={locale}
          suffix="+"
        />
      </p>
    </article>
  );
}
