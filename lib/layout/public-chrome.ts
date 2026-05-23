/** Routes that hide the site footer (focused form flows). */
export const PUBLIC_FOOTER_HIDDEN_SEGMENTS = new Set([
  "booking",
  "complaint",
  "checkin",
]);

/** @deprecated Use PUBLIC_FOOTER_HIDDEN_SEGMENTS */
export const PUBLIC_CHROME_HIDDEN_SEGMENTS = PUBLIC_FOOTER_HIDDEN_SEGMENTS;

/** Mobile bottom nav height (matches PublicBottomNav FAB + label rail). */
export const PUBLIC_BOTTOM_NAV_HEIGHT = "4.25rem";

export function publicMainBottomPadding(): string {
  return `pb-[calc(${PUBLIC_BOTTOM_NAV_HEIGHT}+env(safe-area-inset-bottom,0px))]`;
}

export function publicFabBottomOffset(): string {
  return `max-md:bottom-[calc(${PUBLIC_BOTTOM_NAV_HEIGHT}+0.75rem+env(safe-area-inset-bottom,0px))]`;
}
