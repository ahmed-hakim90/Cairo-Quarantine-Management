import { getPublicSiteUrl } from "@/lib/env";
import { isWhatsappAllowedUrl } from "@/lib/site-contact";

const MAPS_HOSTS = new Set([
  "maps.app.goo.gl",
  "www.google.com",
  "google.com",
  "maps.google.com",
]);

export function isTelAllowedUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed.startsWith("tel:")) return false;
  const digits = trimmed.slice(4).replace(/\D/g, "");
  return digits.length >= 8;
}

export function isMapsAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return MAPS_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function isPortalAllowedUrl(url: string, locale: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith(`/${locale}/`) || trimmed.startsWith("/ar/")) {
    return true;
  }

  const siteOrigin = getPublicSiteUrl();
  if (!siteOrigin) return false;

  try {
    const parsed = new URL(trimmed, siteOrigin);
    const origin = new URL(siteOrigin);
    return parsed.origin === origin.origin;
  } catch {
    return false;
  }
}

export function isChatAllowedUrl(url: string, locale: string): boolean {
  const trimmed = url.trim();
  if (isWhatsappAllowedUrl(trimmed)) return true;
  if (isTelAllowedUrl(trimmed)) return true;
  if (isMapsAllowedUrl(trimmed)) return true;
  if (isPortalAllowedUrl(trimmed, locale)) return true;
  return false;
}
