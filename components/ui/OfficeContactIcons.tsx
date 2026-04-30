function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

const actionClassName =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-gov-gray-200 bg-white text-gov-navy shadow-sm transition-colors hover:bg-gov-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-navy disabled:pointer-events-none disabled:opacity-45";

function telHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `tel:${digits}`;
}

export type OfficeContactIconsProps = {
  phone: string | null | undefined;
  mapsUrl?: string | null;
  ariaPhone: string;
  ariaMap: string;
  /** When set and phone has no dialable digits, a disabled control is shown. */
  ariaPhoneUnavailable?: string;
  phoneMissingTitle?: string;
};

export function OfficeContactIcons({
  phone,
  mapsUrl,
  ariaPhone,
  ariaMap,
  ariaPhoneUnavailable,
  phoneMissingTitle,
}: OfficeContactIconsProps) {
  const href = phone ? telHref(phone) : null;

  return (
    <div className="flex shrink-0 flex-col gap-2">
      {href ? (
        <a href={href} className={actionClassName} aria-label={ariaPhone}>
          <PhoneIcon className="size-5" />
        </a>
      ) : ariaPhoneUnavailable ? (
        <button
          type="button"
          disabled
          className={actionClassName}
          aria-label={ariaPhoneUnavailable}
          title={phoneMissingTitle}
        >
          <PhoneIcon className="size-5" />
        </button>
      ) : null}
      {mapsUrl ? (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={actionClassName}
          aria-label={ariaMap}
        >
          <MapIcon className="size-5" />
        </a>
      ) : null}
    </div>
  );
}
