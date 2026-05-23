"use client";

import { useEffect, useState } from "react";
import { AppSplashOverlay } from "@/components/splash/AppSplashOverlay";

type SplashChromeProps = {
  platformTitle: string;
  platformSubtitle: string;
  loadingLabel: string;
  ariaLabel: string;
  logoAlt: string;
};

/**
 * Splash is client-only after mount so SSR HTML never diverges from the
 * hydrated tree (Framer Motion, reduced-motion, and HMR can otherwise mismatch).
 */
export function SplashChrome(props: SplashChromeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <AppSplashOverlay {...props} />;
}
