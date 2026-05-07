import type { Locale } from "@/lib/i18n/config";

/**
 * Text search on Google Maps (name + address). Less precise than a saved short
 * link / place URL — use {@link resolveOfficeMapUrl} when you have both.
 */
export function googleMapsOfficeSearchUrl(args: {
  placeTitle: string;
  address: string;
  locale: Locale;
}): string {
  const region = args.locale === "ar" ? "القاهرة، مصر" : "Cairo, Egypt";
  const query = `${args.placeTitle}, ${args.address}, ${region}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Hajj/traveler tables are Arabic-only copy; keep query consistent with list data. */
export function googleMapsOfficeSearchUrlAr(placeTitle: string, address: string): string {
  return googleMapsOfficeSearchUrl({
    placeTitle,
    address,
    locale: "ar",
  });
}

/** Prefer a curated Maps link (pin-accurate); fall back to text search if missing. */
export function resolveOfficeMapUrl(args: {
  mapsUrl?: string | null;
  placeTitle: string;
  address: string;
  locale: Locale;
}): string {
  const direct = args.mapsUrl?.trim();
  if (direct) return direct;
  return googleMapsOfficeSearchUrl({
    placeTitle: args.placeTitle,
    address: args.address,
    locale: args.locale,
  });
}

export function resolveOfficeMapUrlAr(args: {
  mapsUrl?: string | null;
  placeTitle: string;
  address: string;
}): string {
  return resolveOfficeMapUrl({ ...args, locale: "ar" });
}
