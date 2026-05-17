export type SpeechVoiceLike = {
  default?: boolean;
  lang: string;
};

const LOCALE_LANGUAGE_MAP: Record<string, string> = {
  ar: "ar-EG",
  en: "en-US",
  fr: "fr-FR",
  zh: "zh-CN",
};

const DEFAULT_LANGUAGE = "ar-EG";
const DEFAULT_CHUNK_SIZE = 180;

export function getSpeechLanguage(locale: string): string {
  const normalized = locale.trim().toLowerCase();
  const baseLocale = normalized.split("-")[0] ?? "";

  return LOCALE_LANGUAGE_MAP[normalized] ?? LOCALE_LANGUAGE_MAP[baseLocale] ?? DEFAULT_LANGUAGE;
}

export function normalizeSpeechText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function splitSpeechText(text: string, maxChunkSize = DEFAULT_CHUNK_SIZE): string[] {
  const normalized = normalizeSpeechText(text);
  if (!normalized) return [];

  const sentenceParts = normalized.match(/[^.!?؟。！？]+[.!?؟。！？،,؛;:]*/g) ?? [
    normalized,
  ];
  const chunks: string[] = [];
  let current = "";

  for (const rawPart of sentenceParts) {
    const part = rawPart.trim();
    if (!part) continue;

    if (part.length > maxChunkSize) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      chunks.push(...splitLongSpeechPart(part, maxChunkSize));
      continue;
    }

    const candidate = current ? `${current} ${part}` : part;
    if (candidate.length <= maxChunkSize) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = part;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

export function selectSpeechVoice<T extends SpeechVoiceLike>(
  voices: readonly T[],
  language: string,
): T | undefined {
  const normalizedLanguage = language.toLowerCase();
  const baseLanguage = normalizedLanguage.split("-")[0];

  return (
    voices.find((voice) => voice.lang.toLowerCase() === normalizedLanguage) ??
    voices.find((voice) => voice.lang.toLowerCase().split("-")[0] === baseLanguage) ??
    voices.find((voice) => voice.default) ??
    voices[0]
  );
}

function splitLongSpeechPart(text: string, maxChunkSize: number): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > maxChunkSize) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      for (let i = 0; i < word.length; i += maxChunkSize) {
        chunks.push(word.slice(i, i + maxChunkSize));
      }
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChunkSize) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = word;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
