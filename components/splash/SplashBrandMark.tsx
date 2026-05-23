"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

type SplashBrandMarkProps = {
  logoAlt: string;
  className?: string;
};

export function SplashBrandMark({ logoAlt, className = "" }: SplashBrandMarkProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`relative ${className}`.trim()}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <span
        className="landing-pulse-glow absolute inset-0 rounded-3xl bg-landing-accent/30 blur-xl"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl bg-white/90 p-1 shadow-lg ring-2 ring-white/80">
        <Image
          src="/icons/icon-192.png"
          alt={logoAlt}
          width={80}
          height={80}
          priority
          className="h-16 w-16 sm:h-20 sm:w-20"
        />
      </div>
    </motion.div>
  );
}
