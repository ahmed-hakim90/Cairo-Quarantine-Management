import { getVaccinationBookingFormUrl } from "@/lib/site-booking";
import type { Locale } from "@/lib/i18n/config";

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

type FloatingVaccinationBookingButtonProps = {
  label: string;
  ariaLabel: string;
  locale: Locale;
  /** When true, omits fixed positioning for use inside a floating column. */
  stacked?: boolean;
};

export function FloatingVaccinationBookingButton({
  label,
  ariaLabel,
  locale,
  stacked = false,
}: FloatingVaccinationBookingButtonProps) {
  const href = getVaccinationBookingFormUrl(locale);

  return (
    <a
      href={href}
      className={
        stacked
          ? "flex size-14 items-center justify-center rounded-full bg-gov-navy text-white shadow-lg shadow-gov-gray-900/25 transition-transform hover:scale-105 focus-visible:scale-105 active:scale-95"
          : "fixed bottom-5 end-5 z-[60] flex size-14 items-center justify-center rounded-full bg-gov-navy text-white shadow-lg shadow-gov-gray-900/25 transition-transform hover:scale-105 focus-visible:scale-105 active:scale-95"
      }
      aria-label={ariaLabel}
      title={label}
    >
      <CalendarIcon className="size-7" />
    </a>
  );
}
