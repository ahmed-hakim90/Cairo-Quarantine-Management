"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { LandingAnimatedBackground } from "@/components/landing/background/LandingAnimatedBackground";
import { HeroIllustration } from "@/components/landing/ui/HeroIllustration";
import type { Locale } from "@/lib/i18n/config";
import type { LandingMessages } from "@/lib/i18n/landing-messages";

type LandingHeroProps = {
  locale: Locale;
  copy: LandingMessages;
};

export function LandingHero({ locale, copy }: LandingHeroProps) {
  const reduceMotion = useReducedMotion();
  const h = copy.hero;

  const fade = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay },
        };

  return (
    <section
      id="top"
      className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden"
      aria-labelledby="landing-hero-title"
    >
      <LandingAnimatedBackground />
      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-24 lg:grid-cols-2 lg:gap-12 lg:py-28">
        <div className="flex flex-col gap-6 text-start">
          <motion.div
            {...fade(0)}
            className="flex items-center gap-3"
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white/80 shadow-md ring-1 ring-white/60"
            >
              <Image
                src="/icons/icon-192.png"
                alt={copy.topBar.logoAlt}
                width={56}
                height={56}
                className="h-full w-full object-cover"
                priority
              />
            </motion.div>
            <span className="text-sm font-semibold text-brand-secondary">
              {copy.topBar.platformName}
            </span>
          </motion.div>

          <motion.h1
            id="landing-hero-title"
            {...fade(0.1)}
            className="font-heading text-3xl font-bold leading-tight text-brand-primary sm:text-4xl lg:text-5xl"
          >
            {h.title}
          </motion.h1>
          <motion.p
            {...fade(0.2)}
            className="text-lg font-medium text-brand-secondary sm:text-xl"
          >
            {h.subtitle}
          </motion.p>
          <motion.p
            {...fade(0.3)}
            className="max-w-xl text-base leading-relaxed text-brand-primary/85"
          >
            {h.description}
          </motion.p>
          <motion.div
            {...fade(0.4)}
            className="flex flex-wrap gap-3 pt-2"
          >
            <LocaleLink
              locale={locale}
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/30 transition-opacity hover:opacity-95"
            >
              {h.ctaPrimary}
            </LocaleLink>
            <a
              href="/booking"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-secondary/50 bg-white/80 px-6 py-3 text-sm font-semibold text-brand-primary backdrop-blur-sm transition-colors hover:bg-white"
            >
              {h.ctaSecondary}
            </a>
          </motion.div>
        </div>

        <motion.div
          {...fade(0.25)}
          className="relative lg:justify-self-end"
        >
          <HeroIllustration ariaLabel={h.illustrationAria} />
        </motion.div>
      </div>
    </section>
  );
}
