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
export function googleMapsOfficeSearchUrlAr(
  placeTitle: string,
  address: string,
): string {
  return googleMapsOfficeSearchUrl({
    placeTitle,
    address,
    locale: "ar",
  });
}

function isGoogleMapsShortUrl(url: string): boolean {
  try {
    return new URL(url).hostname === "maps.app.goo.gl";
  } catch {
    return false;
  }
}

/**
 * Prefer a curated Maps link when it is stable; short Maps URLs can break from
 * one mistyped character, so use search links for them across all office lists.
 */
export function resolveOfficeMapUrl(args: {
  mapsUrl?: string | null;
  placeTitle: string;
  address: string;
  locale: Locale;
}): string {
  const direct = args.mapsUrl?.trim();
  if (direct && !isGoogleMapsShortUrl(direct)) return direct;
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
