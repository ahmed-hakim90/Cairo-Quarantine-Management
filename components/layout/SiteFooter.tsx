import type { Messages } from "@/lib/i18n/messages";
import { PORTFOLIO_CREDIT_URL } from "@/lib/site-credits";

type SiteFooterProps = {
  messages: Messages;
};

export function SiteFooter({ messages }: SiteFooterProps) {
  const f = messages.footer;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gov-gray-200 bg-gov-gray-50 text-gov-gray-700">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="font-heading text-base font-bold text-gov-navy">
              {f.title}
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed">{f.blurb}</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-gov-navy">{f.contactTitle}</p>
            <ul className="mt-3 space-y-2">
              <li>{f.hotline}</li>
              <li>{f.email}</li>
              <li>{f.address}</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gov-gray-200 pt-6 text-center text-xs text-gov-gray-600">
          <p>© {year} — {f.copyright}</p>
          <p className="mt-2">
            <a
              href={PORTFOLIO_CREDIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-gov-navy"
            >
              {f.creditLinkLabel}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
