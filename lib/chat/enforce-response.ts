import { getPublicSiteUrl } from "@/lib/env";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

const BANNED_PHRASES = [
  "أعتقد",
  "ربما",
  "غالباً",
  "حسب معلوماتي",
  "i think",
  "maybe",
  "probably",
  "might be",
];

const MARKDOWN_LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
const URL_RE = /(https?:\/\/[^\s،]+|\/(?:ar|en|zh|fr)(?:\/[^\s،]*)?(?:#[^\s،]+)?)/g;

function isAllowedUrl(url: string, locale: string): boolean {
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

function stripDisallowedLinks(content: string, locale: string): string {
  let result = content.replace(MARKDOWN_LINK_RE, (_match, label: string, url: string) => {
    return isAllowedUrl(url, locale) ? `[${label}](${url})` : String(label);
  });

  result = result.replace(URL_RE, (url) => {
    return isAllowedUrl(url, locale) ? url : "";
  });

  return result.replace(/\s{2,}/g, " ").trim();
}

export function enforceResponseRules(
  content: string,
  localeValue: string | undefined,
): string {
  const locale =
    localeValue && isLocale(localeValue) ? localeValue : defaultLocale;

  let text = content;
  for (const phrase of BANNED_PHRASES) {
    const re = new RegExp(phrase, "gi");
    text = text.replace(re, "");
  }

  text = stripDisallowedLinks(text, locale);

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.slice(0, 4).join("\n");
}
