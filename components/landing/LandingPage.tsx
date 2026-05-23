"use client";

import { LandingFeatures } from "@/components/landing/sections/LandingFeatures";
import { LandingHero } from "@/components/landing/sections/LandingHero";
import { LandingOffices } from "@/components/landing/sections/LandingOffices";
import {
  LandingStats,
  type LandingStatsData,
} from "@/components/landing/sections/LandingStats";
import { LandingSecurity } from "@/components/landing/sections/LandingSecurity";
import { LandingVision2030 } from "@/components/landing/sections/LandingVision2030";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import type { Office } from "@/lib/office-requests/types";
import type { Locale } from "@/lib/i18n/config";
import type { LandingMessages } from "@/lib/i18n/landing-messages";

type LandingPageProps = {
  locale: Locale;
  copy: LandingMessages;
  offices: Office[];
  stats: LandingStatsData;
};

export function LandingPage({
  locale,
  copy,
  offices,
  stats,
}: LandingPageProps) {
  return (
    <div className="landing-gradient-bg min-h-full bg-landing-bg">
      <LandingHero locale={locale} copy={copy} />
      <ScrollReveal initialVisible>
        <LandingFeatures copy={copy.features} />
      </ScrollReveal>
      <ScrollReveal>
        <LandingStats copy={copy.stats} data={stats} locale={locale} />
      </ScrollReveal>
      <ScrollReveal>
        <LandingVision2030 copy={copy.vision} />
      </ScrollReveal>
      <ScrollReveal>
        <LandingOffices offices={offices} locale={locale} copy={copy.offices} />
      </ScrollReveal>
      <ScrollReveal>
        <LandingSecurity copy={copy.security} />
      </ScrollReveal>
    </div>
  );
}
