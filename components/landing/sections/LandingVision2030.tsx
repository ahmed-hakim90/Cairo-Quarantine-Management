"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SectionHeading } from "@/components/landing/ui/SectionHeading";
import type { LandingMessages } from "@/lib/i18n/landing-messages";

type LandingVision2030Props = {
  copy: LandingMessages["vision"];
};

export function LandingVision2030({ copy }: LandingVision2030Props) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="vision"
      className="scroll-mt-20 px-4 py-16 sm:py-20"
      aria-labelledby="landing-vision-heading"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="landing-vision-heading"
          heading={copy.heading}
          intro={copy.intro}
          className="mb-8"
        />

        <ul className="mb-12 flex flex-wrap justify-center gap-2">
          {copy.badges.map((badge) => (
            <li key={badge}>
              <span className="inline-flex rounded-full border border-landing-primary/15 bg-white/80 px-4 py-1.5 text-xs font-semibold text-landing-primary shadow-sm backdrop-blur-sm sm:text-sm">
                {badge}
              </span>
            </li>
          ))}
        </ul>

        <ol className="relative border-s-2 border-landing-accent/40 ps-6 md:border-s-0 md:ps-0">
          <div className="grid gap-8 md:grid-cols-5 md:gap-4">
            {copy.timeline.map((step, index) => (
              <li key={step.year} className="relative md:text-center">
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="glass-panel md:min-h-[180px]"
                >
                  <span className="inline-flex rounded-lg bg-landing-primary px-2.5 py-1 text-xs font-bold text-white">
                    {step.year}
                  </span>
                  <h3 className="mt-3 font-heading text-base font-bold text-landing-primary">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-landing-primary/70">
                    {step.description}
                  </p>
                </motion.div>
                {index < copy.timeline.length - 1 ? (
                  <span
                    className="absolute -bottom-4 start-[-1.6rem] hidden h-2 w-2 rounded-full bg-landing-accent md:start-1/2 md:top-[-1rem] md:block md:-translate-x-1/2"
                    aria-hidden
                  />
                ) : null}
              </li>
            ))}
          </div>
        </ol>
      </div>
    </section>
  );
}
