"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/landing/ui/GlassCard";
import { SECURITY_ICONS } from "@/components/landing/ui/FeatureIcons";
import { SectionHeading } from "@/components/landing/ui/SectionHeading";
import type { LandingMessages } from "@/lib/i18n/landing-messages";

type LandingSecurityProps = {
  copy: LandingMessages["security"];
};

export function LandingSecurity({ copy }: LandingSecurityProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="security"
      className="scroll-mt-20 px-4 py-16 sm:py-20"
      aria-labelledby="landing-security-heading"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="landing-security-heading"
          heading={copy.heading}
          intro={copy.intro}
          className="mb-10"
        />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {copy.items.map((item, index) => {
            const Icon = SECURITY_ICONS[index]!;
            return (
              <li key={item.title}>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                >
                  <GlassCard as="article" className="h-full text-center sm:text-start">
                    <div className="flex justify-center sm:justify-start">
                      <Icon />
                    </div>
                    <h3 className="mt-4 font-heading text-base font-bold text-landing-primary">
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
