"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/landing/ui/GlassCard";
import { FEATURE_ICONS } from "@/components/landing/ui/FeatureIcons";
import { SectionHeading } from "@/components/landing/ui/SectionHeading";
import type { LandingMessages } from "@/lib/i18n/landing-messages";

type LandingFeaturesProps = {
  copy: LandingMessages["features"];
};

export function LandingFeatures({ copy }: LandingFeaturesProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="services"
      className="relative scroll-mt-20 px-4 py-16 sm:py-20"
      aria-labelledby="landing-features-heading"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="landing-features-heading"
          heading={copy.heading}
          intro={copy.intro}
          className="mb-12"
        />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {copy.items.map((item, index) => {
            const Icon = FEATURE_ICONS[index]!;
            return (
              <li key={item.title}>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-8%" }}
                  transition={{ delay: index * 0.06, duration: 0.45 }}
                >
                  <GlassCard as="article" className="h-full">
                    <Icon />
                    <h3 className="mt-4 font-heading text-lg font-bold text-landing-primary">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-landing-primary/70">
                      {item.description}
                    </p>
                  </GlassCard>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
