import { LocaleLink } from "@/components/i18n/LocaleLink";
import { requestModeSwitcherCopy } from "@/lib/i18n/booking-request-copy";
import type { Locale } from "@/lib/i18n/config";

type RequestMode = "booking" | "complaint";

type RequestModeSwitcherProps = {
  locale: Locale;
  activeMode: RequestMode;
};

const modes: Array<{
  mode: RequestMode;
  href: string;
  labelKey: "bookingLabel" | "complaintLabel";
  descriptionKey: "bookingDescription" | "complaintDescription";
}> = [
  {
    mode: "booking",
    href: "/booking",
    labelKey: "bookingLabel",
    descriptionKey: "bookingDescription",
  },
  {
    mode: "complaint",
    href: "/complaint",
    labelKey: "complaintLabel",
    descriptionKey: "complaintDescription",
  },
];

export function RequestModeSwitcher({
  locale,
  activeMode,
}: RequestModeSwitcherProps) {
  const t = requestModeSwitcherCopy[locale];
  return (
    <div className="rounded-lg border border-gov-gray-200 bg-white p-2 shadow-sm">
      <div
        className="grid gap-2 sm:grid-cols-2"
        role="tablist"
        aria-label={t.aria}
      >
        {modes.map((item) => {
          const active = item.mode === activeMode;
          return (
            <LocaleLink
              key={item.mode}
              locale={locale}
              href={item.href}
              role="tab"
              aria-selected={active}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-col justify-center rounded-md px-3 py-2.5 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-accent sm:min-h-16 sm:px-4 sm:py-3 ${
                active
                  ? "bg-gov-navy text-white shadow-sm"
                  : "bg-gov-gray-50 text-gov-navy hover:bg-gov-accent-muted/50"
              }`}
            >
              <span className="text-sm font-extrabold">{t[item.labelKey]}</span>
              <span
                className={`mt-1 line-clamp-2 text-xs leading-relaxed max-sm:text-[0.7rem] ${
                  active ? "text-white/80" : "text-gov-gray-600"
                }`}
              >
                {t[item.descriptionKey]}
              </span>
            </LocaleLink>
          );
        })}
      </div>
    </div>
  );
}
