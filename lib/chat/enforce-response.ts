import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { isChatAllowedUrl } from "@/lib/chat/allowed-links";

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
const URL_RE =
  /(https?:\/\/[^\s)،\]]+|tel:[^\s)،\]]+|\/(?:ar|en|zh|fr)(?:\/[^\s،]*)?(?:#[^\s،]+)?)/g;

function stripDisallowedLinks(content: string, locale: string): string {
  let result = content.replace(MARKDOWN_LINK_RE, (_match, label: string, url: string) => {
    return isChatAllowedUrl(url, locale) ? `[${label}](${url})` : String(label);
  });

  result = result.replace(URL_RE, (url) => {
    return isChatAllowedUrl(url, locale) ? url : "";
  });

  return result.replace(/\s{2,}/g, " ").trim();
}

export function enforceResponseRules(
  content: string,
  localeValue: string | undefined,
  options?: { maxLines?: number },
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

  const maxLines = options?.maxLines ?? 4;
  return lines.slice(0, maxLines).join("\n");
}
