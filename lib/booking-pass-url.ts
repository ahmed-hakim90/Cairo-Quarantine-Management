/** Path only (leading slash, no origin). */
export function buildBookingPassPath(
  locale: string,
  requestId: string,
  token: string,
): string {
  return `/${locale}/booking/pass/${encodeURIComponent(requestId)}?t=${encodeURIComponent(token)}`;
}

export function buildBookingPassUrl(
  siteOrigin: string,
  locale: string,
  requestId: string,
  token: string,
): string {
  const base = siteOrigin.replace(/\/+$/, "");
  return `${base}${buildBookingPassPath(locale, requestId, token)}`;
}

/** Path only (leading slash, no origin). */
export function buildOfficeCheckinQuery(officeId: string, lookup?: string): string {
  const params = new URLSearchParams({ officeId });
  if (lookup?.trim()) {
    params.set("lookup", lookup.trim());
  }
  return `/checkin?${params.toString()}`;
}

export function buildOfficeCheckinPath(
  locale: string,
  officeId: string,
  lookup?: string,
): string {
  return `/${locale}${buildOfficeCheckinQuery(officeId, lookup)}`;
}

export function buildOfficeCheckinUrl(
  siteOrigin: string,
  locale: string,
  officeId: string,
  lookup?: string,
): string {
  const base = siteOrigin.replace(/\/+$/, "");
  return `${base}${buildOfficeCheckinPath(locale, officeId, lookup)}`;
}

/** Derive public origin from reverse-proxy headers (falls back to https). */
export function inferredSiteOriginFromHeaders(headerList: Headers): string {
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  if (!host) return "";
  return `${proto}://${host}`.replace(/\/+$/, "");
}
