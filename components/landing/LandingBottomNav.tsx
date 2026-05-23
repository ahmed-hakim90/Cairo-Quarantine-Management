"use client";

import { useEffect, useState } from "react";
import type { LandingMessages } from "@/lib/i18n/landing-messages";

const SECTION_IDS = ["top", "services", "offices", "support"] as const;

type LandingBottomNavProps = {
  copy: LandingMessages["bottomNav"];
};

export function LandingBottomNav({ copy }: LandingBottomNavProps) {
  const [active, setActive] = useState<(typeof SECTION_IDS)[number]>("top");

  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      Boolean,
    ) as HTMLElement[];

    if (sections.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id && SECTION_IDS.includes(visible.target.id as (typeof SECTION_IDS)[number])) {
          setActive(visible.target.id as (typeof SECTION_IDS)[number]);
        }
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: [0, 0.25, 0.5] },
    );

    sections.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const items = [
    { id: "top" as const, label: copy.home, href: "#top" },
    { id: "services" as const, label: copy.services, href: "#services" },
    { id: "offices" as const, label: copy.offices, href: "#offices" },
    { id: "support" as const, label: copy.support, href: "#support" },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/40 bg-white/85 backdrop-blur-xl md:hidden"
      aria-label={copy.aria}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around pb-[env(safe-area-inset-bottom,0px)]">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id} className="flex-1">
              <a
                href={item.href}
                className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-2 py-2 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? "text-landing-primary"
                    : "text-landing-primary/50"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={`h-1 w-8 rounded-full transition-colors ${
                    isActive ? "bg-landing-accent" : "bg-transparent"
                  }`}
                  aria-hidden
                />
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
