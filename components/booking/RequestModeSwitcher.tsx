import { LocaleLink } from "@/components/i18n/LocaleLink";
import type { Locale } from "@/lib/i18n/config";

type RequestMode = "booking" | "complaint";

type RequestModeSwitcherProps = {
  locale: Locale;
  activeMode: RequestMode;
};

const modes: Array<{
  mode: RequestMode;
  href: string;
  label: string;
  description: string;
}> = [
  {
    mode: "booking",
    href: "/booking",
    label: "حجز موعد",
    description: "للمسافرين والمواطنين",
  },
  {
    mode: "complaint",
    href: "/complaint",
    label: "شكوى أو مقترح",
    description: "متابعة مع المكتب المختص",
  },
];

export function RequestModeSwitcher({
  locale,
  activeMode,
}: RequestModeSwitcherProps) {
  return (
    <div className="rounded-lg border border-gov-gray-200 bg-white p-2 shadow-sm">
      <div
        className="grid gap-2 sm:grid-cols-2"
        role="tablist"
        aria-label="اختيار نوع الطلب"
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
              className={`flex min-h-16 flex-col justify-center rounded-md px-4 py-3 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-accent ${
                active
                  ? "bg-gov-navy text-white shadow-sm"
                  : "bg-gov-gray-50 text-gov-navy hover:bg-gov-accent-muted/50"
              }`}
            >
              <span className="text-sm font-extrabold">{item.label}</span>
              <span
                className={`mt-1 text-xs leading-relaxed ${
                  active ? "text-white/80" : "text-gov-gray-600"
                }`}
              >
                {item.description}
              </span>
            </LocaleLink>
          );
        })}
      </div>
    </div>
  );
}
