import { WhatsAppContactLink } from "@/components/layout/WhatsAppContactLink";

/** @deprecated Floating WhatsApp removed; use footer or CompactWhatsAppBar. */
export function FloatingWhatsAppButton() {
  return (
    <WhatsAppContactLink
      variant="compact"
      label="واتساب"
      ariaLabel="فتح واتساب للشكاوى والاقتراحات"
    />
  );
}

export { WhatsAppIcon } from "@/components/layout/WhatsAppContactLink";
