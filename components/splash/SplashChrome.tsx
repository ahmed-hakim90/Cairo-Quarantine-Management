"use client";

import { AppSplashOverlay } from "@/components/splash/AppSplashOverlay";

type SplashChromeProps = {
  siteName: string;
  loadingLabel: string;
  ariaLabel: string;
};

export function SplashChrome({
  siteName,
  loadingLabel,
  ariaLabel,
}: SplashChromeProps) {
  return (
    <AppSplashOverlay
      siteName={siteName}
      loadingLabel={loadingLabel}
      ariaLabel={ariaLabel}
    />
  );
}
