"use client";

import Image from "next/image";
import { usePwaInstall } from "@/lib/pwa/use-pwa-install";

type PwaInstallCardProps = {
  title: string;
  body: string;
  installButton: string;
  dismissLabel?: string;
  ariaLabel: string;
  iosHelp: string;
  /** Inline card on queue page — no snooze, always visible until installed. */
  variant?: "queue" | "default";
  className?: string;
};

export function PwaInstallCard({
  title,
  body,
  installButton,
  dismissLabel,
  ariaLabel,
  iosHelp,
  variant = "default",
  className = "",
}: PwaInstallCardProps) {
  const isQueue = variant === "queue";
  const {
    shouldShow,
    canPromptInstall,
    showIosHint,
    promptInstall,
    dismiss,
  } = usePwaInstall(
    isQueue
      ? { useSnooze: false, iosHintDelayMs: 0 }
      : {
          snoozeKey: "cqm:install-prompt-snoozed-until",
          useSnooze: true,
          iosHintDelayMs: 4000,
        },
  );

  if (!shouldShow) return null;

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={`rounded-xl border border-gov-navy/15 bg-gradient-to-br from-gov-navy to-gov-accent/90 p-4 text-white shadow-md ${className}`}
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
          <p className="text-sm font-bold leading-snug">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/90">{body}</p>
          {showIosHint && !canPromptInstall ? (
            <p className="mt-2 text-[11px] leading-relaxed text-white/80">
              {iosHelp}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {canPromptInstall ? (
              <button
                type="button"
                onClick={() => void promptInstall()}
                className="inline-flex min-h-10 items-center rounded-md bg-white px-4 text-sm font-bold text-gov-navy transition hover:bg-white/90"
              >
                {installButton}
              </button>
            ) : null}
            {dismissLabel && !isQueue ? (
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex min-h-10 items-center rounded-md border border-white/30 px-3 text-sm font-medium text-white hover:bg-white/10"
              >
                {dismissLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
