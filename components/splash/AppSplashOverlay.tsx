"use client";

import { useEffect, useState } from "react";
import { SplashPlaneIcon } from "@/components/splash/SplashPlaneIcon";
import { SplashProgressTrack } from "@/components/splash/SplashProgressTrack";

const MIN_DISPLAY_MS = 700;
const FONTS_TIMEOUT_MS = 2000;
const FADE_MS = 400;

type AppSplashOverlayProps = {
  siteName: string;
  loadingLabel: string;
  ariaLabel: string;
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
  siteName,
  loadingLabel,
  ariaLabel,
}: AppSplashOverlayProps) {
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
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      id="cqm-splash-overlay"
      role="status"
      aria-busy={phase === "visible"}
      aria-label={ariaLabel}
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gov-navy px-6 text-center text-white transition-opacity duration-[400ms] ${
        phase === "fading"
          ? "pointer-events-none opacity-0"
          : "opacity-100"
      }`}
    >
      <div className="flex max-w-sm flex-col items-center gap-5">
        <SplashPlaneIcon className="h-16 w-16 sm:h-20 sm:w-20" />
        <div className="space-y-2">
          <p className="font-heading text-lg font-bold leading-snug text-balance sm:text-xl">
            {siteName}
          </p>
          <p className="text-sm text-white/80">{loadingLabel}</p>
        </div>
        <SplashProgressTrack />
      </div>
    </div>
  );
}
