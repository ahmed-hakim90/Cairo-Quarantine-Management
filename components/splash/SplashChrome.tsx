"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AppSplashOverlay } from "@/components/splash/AppSplashOverlay";
import {
  clearSplashActiveClass,
  hasSplashCompleted,
} from "@/lib/splash/splash-session-storage";

type SplashChromeProps = {
  platformTitle: string;
  platformSubtitle: string;
  loadingLabel: string;
  ariaLabel: string;
  logoAlt: string;
};

function subscribeSplashCompleted() {
  return () => {};
}

function getSplashCompletedSnapshot() {
  return hasSplashCompleted();
}

function getSplashCompletedServerSnapshot() {
  return false;
}

/**
 * Splash is client-only after mount so SSR HTML never diverges from the
 * hydrated tree (Framer Motion, reduced-motion, and HMR can otherwise mismatch).
 * Shown only once per tab session (sessionStorage).
 */
export function SplashChrome(props: SplashChromeProps) {
  const splashCompleted = useSyncExternalStore(
    subscribeSplashCompleted,
    getSplashCompletedSnapshot,
    getSplashCompletedServerSnapshot,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (splashCompleted) clearSplashActiveClass();
  }, [splashCompleted]);

  if (splashCompleted) return null;
  if (!mounted) return null;

  return <AppSplashOverlay {...props} />;
}
