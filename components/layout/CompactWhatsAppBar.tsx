import { WhatsAppContactLink } from "@/components/layout/WhatsAppContactLink";

type CompactWhatsAppBarProps = {
  label: string;
  ariaLabel: string;
};

export function CompactWhatsAppBar({ label, ariaLabel }: CompactWhatsAppBarProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[55] border-t border-gov-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm"
      role="region"
      aria-label={ariaLabel}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center">
        <WhatsAppContactLink
          variant="compact"
          label={label}
          ariaLabel={ariaLabel}
        />
      </div>
    </div>
  );
}
