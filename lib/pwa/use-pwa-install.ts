"use client";

import { useCallback, useEffect, useState } from "react";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DEFAULT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export type UsePwaInstallOptions = {
  /** localStorage key for snooze; omit to disable snooze reads/writes */
  snoozeKey?: string;
  snoozeMs?: number;
  /** When false, never read/write snooze (queue card). Default true when snoozeKey set. */
  useSnooze?: boolean;
  /** Delay before showing UI on iOS when no deferred prompt (global banner). */
  iosHintDelayMs?: number;
  /** Limit global install UI to phones/tablets. Other install entry points can opt out. */
  mobileOnly?: boolean;
};

function readSnoozed(snoozeKey: string): boolean {
  try {
    const v = window.localStorage.getItem(snoozeKey);
    if (!v) return false;
    const ts = Number.parseInt(v, 10);
    return Number.isFinite(ts) && ts > Date.now();
  } catch {
    return false;
  }
}

function writeSnooze(snoozeKey: string, snoozeMs: number): void {
  try {
    window.localStorage.setItem(
      snoozeKey,
      String(Date.now() + snoozeMs),
    );
  } catch {
    /* ignore */
  }
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function detectIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

function detectMobileLike(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      ua,
    ) ||
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(max-width: 767px)").matches
  );
}

function initialDismissed(
  useSnooze: boolean,
  snoozeKey: string | undefined,
): boolean {
  if (typeof window === "undefined" || !useSnooze || !snoozeKey) return false;
  return readSnoozed(snoozeKey);
}

export function usePwaInstall(options: UsePwaInstallOptions = {}) {
  const {
    snoozeKey,
    snoozeMs = DEFAULT_SNOOZE_MS,
    useSnooze = Boolean(snoozeKey),
    iosHintDelayMs = 0,
    mobileOnly = false,
  } = options;

  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isStandalone, setIsStandalone] = useState(detectStandalone);
  const [isIos] = useState(detectIos);
  const [isMobileLike, setIsMobileLike] = useState(detectMobileLike);
  const [dismissed, setDismissed] = useState(() =>
    initialDismissed(useSnooze, snoozeKey),
  );
  const [iosHintReady, setIosHintReady] = useState(iosHintDelayMs === 0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferred(null);
      setIsStandalone(true);
      if (useSnooze && snoozeKey) writeSnooze(snoozeKey, snoozeMs);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    let iosTimer: number | undefined;
    if (isIos && iosHintDelayMs > 0) {
      iosTimer = window.setTimeout(() => setIosHintReady(true), iosHintDelayMs);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, [iosHintDelayMs, isIos, isStandalone, snoozeKey, snoozeMs, useSnooze]);

  useEffect(() => {
    if (typeof window === "undefined" || !mobileOnly) return;
    const mediaQueries = [
      window.matchMedia("(pointer: coarse)"),
      window.matchMedia("(max-width: 767px)"),
    ];
    const updateMobileLike = () => setIsMobileLike(detectMobileLike());

    mediaQueries.forEach((query) =>
      query.addEventListener("change", updateMobileLike),
    );
    return () => {
      mediaQueries.forEach((query) =>
        query.removeEventListener("change", updateMobileLike),
      );
    };
  }, [mobileOnly]);

  const canPromptInstall = Boolean(deferred);
  const showIosHint = isIos && !deferred && iosHintReady;
  const shouldShow =
    !isStandalone &&
    !dismissed &&
    (!mobileOnly || isMobileLike) &&
    (canPromptInstall || showIosHint);

  const promptInstall = useCallback(async () => {
    if (!deferred) return false;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome !== "accepted" && useSnooze && snoozeKey) {
        writeSnooze(snoozeKey, snoozeMs);
        setDismissed(true);
      }
      return choice.outcome === "accepted";
    } finally {
      setDeferred(null);
    }
  }, [deferred, snoozeKey, snoozeMs, useSnooze]);

  const dismiss = useCallback(() => {
    if (useSnooze && snoozeKey) writeSnooze(snoozeKey, snoozeMs);
    setDismissed(true);
  }, [snoozeKey, snoozeMs, useSnooze]);

  return {
    deferred,
    isStandalone,
    isIos,
    isMobileLike,
    canPromptInstall,
    showIosHint,
    shouldShow,
    promptInstall,
    dismiss,
  };
}
