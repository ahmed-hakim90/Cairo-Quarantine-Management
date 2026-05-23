import { LocaleLink } from "@/components/i18n/LocaleLink";
import { WhatsAppContactLink } from "@/components/layout/WhatsAppContactLink";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type LandingFooterProps = {
  locale: Locale;
  messages: Messages;
};

export function LandingFooter({ locale, messages }: LandingFooterProps) {
  const f = messages.landing.footer;
  const year = new Date().getFullYear();

  return (
    <footer
      id="support"
      className="scroll-mt-20 border-t border-landing-primary/10 bg-white/60 px-4 py-12 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-6xl">
        <nav
          className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-landing-primary"
          aria-label={f.support}
        >
          <span className="text-landing-primary/60" aria-disabled>
            {f.privacy}
            <span className="sr-only"> — {f.privacyUnavailable}</span>
          </span>
          <WhatsAppContactLink
            variant="compact"
            label={f.support}
            ariaLabel={messages.footer.whatsappAria}
          />
          <LocaleLink
            locale={locale}
            href="/charter"
            className="underline-offset-2 hover:underline"
          >
            {f.helpCenter}
          </LocaleLink>
        </nav>
        <p className="mt-8 text-center text-xs text-landing-primary/65">
          © {year} — {f.copyright}
        </p>
      </div>
    </footer>
  );
}
