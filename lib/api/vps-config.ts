/** Server-side VPS API feature flag and URL resolution. */

export function getVpsApiBaseUrl(): string | null {
  const raw = (
    process.env.CQM_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    ""
  ).trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

export function isVpsApiEnabled(): boolean {
  return process.env.USE_VPS_API === "true" && Boolean(getVpsApiBaseUrl());
}

export function getAdminApiSecret(): string | null {
  const secret = process.env.ADMIN_API_SECRET?.trim();
  return secret || null;
}
