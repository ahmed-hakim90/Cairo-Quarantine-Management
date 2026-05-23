"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  label: string;
  locale: string;
};

function formatValue(value: number, locale: string) {
  const intlLocale =
    locale === "ar"
      ? "ar-EG"
      : locale === "zh"
        ? "zh-CN"
        : locale === "fr"
          ? "fr-FR"
          : "en";
  return new Intl.NumberFormat(intlLocale).format(Math.round(value));
}

export function AnimatedCounter({ value, label, locale }: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduceMotion = useReducedMotion();
  const [animated, setAnimated] = useState(0);
  const display = reduceMotion ? value : animated;

  useEffect(() => {
    if (!inView || reduceMotion) return;

    const duration = 1400;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setAnimated(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, reduceMotion]);

  return (
    <motion.div
      ref={ref}
      className="glass-panel flex flex-col items-center justify-center rounded-2xl px-4 py-8 text-center"
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5 }}
    >
      <p className="font-heading text-3xl font-bold tabular-nums text-landing-primary sm:text-4xl">
        {formatValue(display, locale)}
      </p>
      <p className="mt-2 text-sm font-medium text-landing-primary/70 sm:text-base">
        {label}
      </p>
    </motion.div>
  );
}
