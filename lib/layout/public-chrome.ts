/** Routes that hide the site footer (focused form flows). */
export const PUBLIC_FOOTER_HIDDEN_SEGMENTS = new Set([
  "booking",
  "complaint",
  "checkin",
]);

/** @deprecated Use PUBLIC_FOOTER_HIDDEN_SEGMENTS */
export const PUBLIC_CHROME_HIDDEN_SEGMENTS = PUBLIC_FOOTER_HIDDEN_SEGMENTS;

/**
 * Mobile bottom nav height — must match `--public-bottom-nav-height` in globals.css.
 */
export const PUBLIC_BOTTOM_NAV_HEIGHT = "5.25rem";

/** Tailwind-safe utility classes (see globals.css). */
export const PUBLIC_MAIN_BOTTOM_PAD_CLASS = "public-main-bottom-pad";
export const PUBLIC_CHROME_BOTTOM_GAP_CLASS = "public-chrome-bottom-gap";
export const PUBLIC_FAB_ANCHOR_CLASS = "public-fab-anchor";
