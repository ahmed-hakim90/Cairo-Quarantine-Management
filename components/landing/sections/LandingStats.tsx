"use client";

import { AnimatedCounter } from "@/components/landing/ui/AnimatedCounter";
import { SectionHeading } from "@/components/landing/ui/SectionHeading";
import type { LandingMessages } from "@/lib/i18n/landing-messages";

export type LandingStatsData = {
  offices: number;
  services: number;
  dailyRequests: number;
  users: number;
};

type LandingStatsProps = {
  copy: LandingMessages["stats"];
  data: LandingStatsData;
  locale: string;
};

export function LandingStats({ copy, data, locale }: LandingStatsProps) {
  const items = [
    { label: copy.offices, value: data.offices },
    { label: copy.services, value: data.services },
    { label: copy.dailyRequests, value: data.dailyRequests },
    { label: copy.users, value: data.users },
  ];

  return (
    <section
      id="stats"
      className="scroll-mt-20 bg-landing-primary/[0.04] px-4 py-16 sm:py-20"
      aria-labelledby="landing-stats-heading"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="landing-stats-heading"
          heading={copy.heading}
          className="mb-10"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <AnimatedCounter
              key={item.label}
              label={item.label}
              value={item.value}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
