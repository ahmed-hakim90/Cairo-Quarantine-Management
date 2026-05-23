"use client";

import { useState } from "react";
import { ChatWidget } from "@/components/chat/ChatWidget";
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
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <div className={`fixed start-5 z-[60] ${PUBLIC_FAB_ANCHOR_CLASS}`}>
        <ChatWidget
          locale={locale}
          messages={messages.chat}
          onOpenChange={setChatOpen}
        />
      </div>

      <div
        className={`fixed end-5 z-[60] flex flex-col items-center gap-3 ${PUBLIC_FAB_ANCHOR_CLASS}`}
      >
        <div className={chatOpen ? "max-sm:hidden" : undefined}>
          <FloatingTextToSpeechButton locale={locale} labels={messages.tts} />
        </div>
      </div>
    </>
  );
}
