import { defaultLocale, isLocale } from "@/lib/i18n/config";

/** Locale-prefixed public path (e.g. `/ar/booking`). Safe for client bundles. */
export function formatPortalUrl(locale: string, path = ""): string {
  const loc = isLocale(locale) ? locale : defaultLocale;
  const segment = path.replace(/^\/+/, "");
  return segment ? `/${loc}/${segment}` : `/${loc}`;
}

/** Locale-free path with optional query/hash (e.g. `/international-traveler?country=x#y`). */
export function formatPortalHref(
  segment = "",
  options?: { hash?: string; query?: Record<string, string> },
): string {
  let href = segment ? `/${segment.replace(/^\/+/, "")}` : "/";
  if (options?.query && Object.keys(options.query).length > 0) {
    href += `?${new URLSearchParams(options.query).toString()}`;
  }
  if (options?.hash) {
    href += options.hash.startsWith("#") ? options.hash : `#${options.hash}`;
  }
  return href;
}
