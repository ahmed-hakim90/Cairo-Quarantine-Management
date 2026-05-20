"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Messages } from "@/lib/i18n/messages";
import { usePwaInstall } from "@/lib/pwa/use-pwa-install";

const SNOOZE_KEY = "cqm:install-prompt-snoozed-until";
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_SCROLL_Y = 400;
const SHOW_DELAY_MS = 15_000;

type InstallPromptProps = {
  pwa: Messages["pwa"];
};

export function InstallPrompt({ pwa }: InstallPromptProps) {
  const [engagementGateOpen, setEngagementGateOpen] = useState(false);
  const {
    shouldShow,
    canPromptInstall,
    showIosHint,
    promptInstall,
    dismiss,
  } = usePwaInstall({
    snoozeKey: SNOOZE_KEY,
    useSnooze: true,
    snoozeMs: SNOOZE_MS,
    iosHintDelayMs: 4000,
    mobileOnly: true,
  });

  useEffect(() => {
    const openGate = () => setEngagementGateOpen(true);
    const onScroll = () => {
      if (window.scrollY >= MIN_SCROLL_Y) openGate();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    const timer = window.setTimeout(openGate, SHOW_DELAY_MS);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  if (!shouldShow || !engagementGateOpen) return null;

  return (
    <div
      role="region"
      aria-label={pwa.installAria}
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md rounded-lg border border-white/10 bg-gov-navy/95 p-3 text-white shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-gov-navy/85 sm:hidden"
    >
      <div className="flex items-start gap-2.5">
        <div className="shrink-0 overflow-hidden rounded-md bg-white/10">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={48}
            height={48}
            className="h-10 w-10"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug">{pwa.installTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/85">
            {pwa.installBody}
          </p>
          {showIosHint && !canPromptInstall ? (
            <p className="mt-2 text-[11px] leading-relaxed text-white/75">
              {pwa.iosHelp}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {canPromptInstall ? (
              <button
                type="button"
                onClick={() => void promptInstall()}
                className="inline-flex min-h-9 items-center rounded-md bg-white px-3 text-sm font-semibold text-gov-navy transition-colors hover:bg-white/90"
              >
                {pwa.installButton}
              </button>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-9 items-center rounded-md border border-white/30 bg-transparent px-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              {pwa.installDismiss}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
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
