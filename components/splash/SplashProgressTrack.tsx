"use client";

import { motion, useReducedMotion } from "framer-motion";

type SplashProgressTrackProps = {
  className?: string;
  active?: boolean;
};

export function SplashProgressTrack({
  className = "",
  active = true,
}: SplashProgressTrackProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={`mx-auto h-1.5 w-[min(18rem,72vw)] overflow-hidden rounded-full bg-landing-primary/10 ${className}`.trim()}
      aria-hidden
    >
      {reduceMotion ? (
        <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-landing-secondary to-landing-accent" />
      ) : (
        <motion.div
          className="h-full w-2/5 rounded-full bg-gradient-to-r from-landing-primary via-landing-secondary to-landing-accent shadow-sm"
          animate={
            active
              ? {
                  x: ["-100%", "220%"],
                }
              : undefined
          }
          transition={
            active
              ? {
                  duration: 1.35,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
