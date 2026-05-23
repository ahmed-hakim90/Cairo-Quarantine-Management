"use client";

import { FloatingParticles } from "@/components/landing/background/FloatingParticles";

/** Shared glass/gradient backdrop for welcome and app splash. */
export function PlatformAnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="landing-gradient-bg absolute inset-0" />
      <div
        className="landing-blob landing-pulse-glow absolute -start-24 top-1/4 h-72 w-72 rounded-full bg-landing-accent/25 blur-3xl"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="landing-blob absolute end-0 top-0 h-80 w-80 rounded-full bg-landing-secondary/20 blur-3xl"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="landing-blob absolute bottom-0 start-1/3 h-64 w-64 rounded-full bg-landing-primary/15 blur-3xl"
        style={{ animationDelay: "-7s" }}
      />
      <FloatingParticles />
    </div>
  );
}
