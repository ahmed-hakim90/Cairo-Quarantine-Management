export const SPLASH_SESSION_KEY = "cqm-splash-completed";

const COMPLETED_VALUE = "1";

export function hasSplashCompleted(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return sessionStorage.getItem(SPLASH_SESSION_KEY) === COMPLETED_VALUE;
  } catch {
    return false;
  }
}

export function markSplashCompleted(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(SPLASH_SESSION_KEY, COMPLETED_VALUE);
  } catch {
    // Private mode or storage quota — splash may reappear on next load.
  }
}

export function clearSplashActiveClass(): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("cqm-splash-active");
}
