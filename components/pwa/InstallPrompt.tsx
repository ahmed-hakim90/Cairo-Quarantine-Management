"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Messages } from "@/lib/i18n/messages";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallPromptProps = {
  pwa: Messages["pwa"];
};

const SNOOZE_KEY = "cqm:install-prompt-snoozed-until";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function isSnoozed(): boolean {
  try {
    const v = window.localStorage.getItem(SNOOZE_KEY);
    if (!v) return false;
    const ts = Number.parseInt(v, 10);
    return Number.isFinite(ts) && ts > Date.now();
  } catch {
    return false;
  }
}

function snooze(): void {
  try {
    window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  } catch {
    /* ignore */
  }
}

export function InstallPrompt({ pwa }: InstallPromptProps) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (isSnoozed()) return;

    const ua = window.navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/.test(ua) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
      try {
        window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS does not fire beforeinstallprompt — show the iOS hint after a
    // short delay so it doesn't compete with first paint.
    let iosTimer: number | undefined;
    if (ios) {
      iosTimer = window.setTimeout(() => setVisible(true), 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  if (!visible) return null;

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome !== "accepted") snooze();
    } finally {
      setDeferred(null);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    snooze();
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label={pwa.installAria}
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md rounded-2xl border border-white/10 bg-gov-navy/95 p-4 text-white shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-gov-navy/85 sm:bottom-4 sm:inset-x-4"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 overflow-hidden rounded-xl bg-white/10">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug">{pwa.installTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/85">
            {pwa.installBody}
          </p>
          {isIOS && !deferred ? (
            <p className="mt-2 text-[11px] leading-relaxed text-white/75">
              {pwa.iosHelp}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {deferred ? (
              <button
                type="button"
                onClick={handleInstall}
                className="inline-flex min-h-10 items-center rounded-md bg-white px-4 text-sm font-semibold text-gov-navy transition-colors hover:bg-white/90"
              >
                {pwa.installButton}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex min-h-10 items-center rounded-md border border-white/30 bg-transparent px-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              {pwa.installDismiss}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={pwa.installDismiss}
          className="-m-1 shrink-0 rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <path
              d="M4 4l10 10M14 4L4 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
