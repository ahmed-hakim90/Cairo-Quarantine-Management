"use client";

import { CompactWhatsAppBar } from "@/components/layout/CompactWhatsAppBar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { FloatingTextToSpeechButton } from "@/components/layout/FloatingTextToSpeechButton";
import { FloatingVaccinationBookingButton } from "@/components/layout/FloatingVaccinationBookingButton";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { usePathname } from "next/navigation";

const footerHiddenSegments = new Set(["booking", "complaint", "checkin"]);

type PublicFloatingChromeProps = {
  locale: Locale;
  messages: Messages;
};

export function PublicFloatingChrome({
  locale,
  messages,
}: PublicFloatingChromeProps) {
  const pathname = usePathname();
  const [, , pageSegment] = pathname.split("/");
  const showCompactWhatsapp = footerHiddenSegments.has(pageSegment);

  return (
    <>
      {showCompactWhatsapp ? (
        <CompactWhatsAppBar
          label={messages.footer.whatsappLabel}
          ariaLabel={messages.footer.whatsappAria}
        />
      ) : null}

      <div className="fixed bottom-5 start-5 z-[60]">
        <ChatWidget locale={locale} messages={messages.chat} />
      </div>

      <div className="fixed bottom-5 end-5 z-[60] flex flex-col items-center gap-3">
        <FloatingTextToSpeechButton locale={locale} labels={messages.tts} />
        <FloatingVaccinationBookingButton
          label={messages.nav.bookVaccination}
          ariaLabel={messages.nav.bookVaccinationAria}
          locale={locale}
          stacked
        />
      </div>
    </>
  );
}
