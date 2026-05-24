"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { PlatformAnimatedBackground } from "@/components/brand/PlatformAnimatedBackground";
import { SplashBrandMark } from "@/components/splash/SplashBrandMark";
import { SplashProgressTrack } from "@/components/splash/SplashProgressTrack";
import {
  clearSplashActiveClass,
  markSplashCompleted,
} from "@/lib/splash/splash-session-storage";

const MIN_DISPLAY_MS = 800;
const FONTS_TIMEOUT_MS = 2000;
const FADE_MS = 500;

type AppSplashOverlayProps = {
  platformTitle: string;
  platformSubtitle: string;
  loadingLabel: string;
  ariaLabel: string;
  logoAlt: string;
};

function waitForDocumentReady(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

function waitForFonts(timeoutMs: number): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  const fontsReady = document.fonts?.ready;
  if (!fontsReady) return Promise.resolve();
  return Promise.race([
    fontsReady.then(() => undefined),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function AppSplashOverlay({
  platformTitle,
  platformSubtitle,
  loadingLabel,
  ariaLabel,
  logoAlt,
}: AppSplashOverlayProps) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"visible" | "fading" | "hidden">("visible");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const startedAt = Date.now();
      await Promise.all([
        waitForDocumentReady(),
        waitForFonts(FONTS_TIMEOUT_MS),
      ]);
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_DISPLAY_MS) {
        await delay(MIN_DISPLAY_MS - elapsed);
      }
      if (cancelled) return;
      setPhase("fading");
      await delay(FADE_MS);
      if (cancelled) return;
      setPhase("hidden");
      markSplashCompleted();
      clearSplashActiveClass();
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AnimatePresence>
      {phase !== "hidden" ? (
        <motion.div
          id="cqm-splash-overlay"
          role="status"
          aria-busy={phase === "visible"}
          aria-label={ariaLabel}
          className={`fixed inset-0 z-[200] flex items-center justify-center overflow-hidden px-6 ${
            phase === "fading" ? "pointer-events-none" : ""
          }`}
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === "fading" ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0.15 : FADE_MS / 1000,
            ease: "easeOut",
          }}
        >
          <PlatformAnimatedBackground />

          <motion.div
            className="glass-panel relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-3xl px-8 py-10 text-center shadow-xl"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <SplashBrandMark logoAlt={logoAlt} />

            <div className="space-y-2">
              <motion.p
                className="font-heading text-xl font-bold leading-snug text-landing-primary text-balance sm:text-2xl"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.45 }}
              >
                {platformTitle}
              </motion.p>
              <motion.p
                className="text-sm leading-relaxed text-landing-secondary sm:text-base"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.45 }}
              >
                {platformSubtitle}
              </motion.p>
            </div>

            <motion.div
              className="w-full space-y-3"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.38, duration: 0.4 }}
            >
              <SplashProgressTrack active={phase === "visible"} />
              <p className="text-xs font-medium text-landing-primary/65 sm:text-sm">
                {loadingLabel}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
