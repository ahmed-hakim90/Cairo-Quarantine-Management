import { WhatsAppContactLink } from "@/components/layout/WhatsAppContactLink";
import type { Messages } from "@/lib/i18n/messages";
import { PORTFOLIO_CREDIT_URL } from "@/lib/site-credits";

type SiteFooterProps = {
  messages: Messages;
};

export function SiteFooter({ messages }: SiteFooterProps) {
  const f = messages.footer;
  const year = new Date().getFullYear();

  return (
    <footer className="mb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] border-t border-brand-gray-200 bg-brand-gray-50 text-brand-gray-700 md:mb-0">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="font-heading text-base font-bold text-brand-primary">
              {f.title}
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed">{f.blurb}</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-brand-primary">{f.contactTitle}</p>
            <ul className="mt-3 space-y-2">
              <WhatsAppContactLink
                variant="footer"
                label={f.whatsappLabel}
                ariaLabel={f.whatsappAria}
              />
              <li>{f.email}</li>
              <li>{f.address}</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-brand-gray-200 pt-6 text-center text-xs text-brand-gray-600">
          <p>© {year} — {f.copyright}</p>
          <p className="mt-2">
            <a
              href={PORTFOLIO_CREDIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-brand-primary"
            >
              {f.creditLinkLabel}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
