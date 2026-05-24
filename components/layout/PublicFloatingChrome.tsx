"use client";

import { FloatingTextToSpeechButton } from "@/components/layout/FloatingTextToSpeechButton";
import { PUBLIC_FAB_ANCHOR_CLASS } from "@/lib/layout/public-chrome";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type PublicFloatingChromeProps = {
  locale: Locale;
  messages: Messages;
};

export function PublicFloatingChrome({
  locale,
  messages,
}: PublicFloatingChromeProps) {
  return (
    <div
      className={`fixed end-5 z-[60] flex max-md:bottom-[calc(5.25rem+1rem+env(safe-area-inset-bottom,0px))] flex-col items-center gap-3 md:bottom-5 ${PUBLIC_FAB_ANCHOR_CLASS}`}
    >
      <FloatingTextToSpeechButton locale={locale} labels={messages.tts} />
    </div>
  );
}
