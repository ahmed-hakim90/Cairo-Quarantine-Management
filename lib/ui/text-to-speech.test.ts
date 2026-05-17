import { describe, expect, it } from "vitest";
import {
  getSpeechLanguage,
  normalizeSpeechText,
  selectSpeechVoice,
  splitSpeechText,
  type SpeechVoiceLike,
} from "@/lib/ui/text-to-speech";

describe("getSpeechLanguage", () => {
  it("maps supported locales to speech languages", () => {
    expect(getSpeechLanguage("ar")).toBe("ar-EG");
    expect(getSpeechLanguage("en")).toBe("en-US");
    expect(getSpeechLanguage("zh")).toBe("zh-CN");
    expect(getSpeechLanguage("fr")).toBe("fr-FR");
  });

  it("falls back to Arabic for unknown locales", () => {
    expect(getSpeechLanguage("de")).toBe("ar-EG");
  });
});

describe("splitSpeechText", () => {
  it("splits long Arabic text into bounded chunks without losing content", () => {
    const text =
      "مرحبا بكم في إدارة الحجر الصحي بالقاهرة. يرجى مراجعة بيانات المراكز قبل الحضور، والتأكد من المستندات المطلوبة. هذا النص طويل لاختبار تقسيم القراءة على الهواتف.";
    const chunks = splitSpeechText(text, 60);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 60)).toBe(true);
    expect(normalizeSpeechText(chunks.join(" "))).toBe(normalizeSpeechText(text));
  });

  it("splits long English text into bounded chunks without losing content", () => {
    const text =
      "Welcome to Cairo Quarantine Administration. Please review office details before visiting, and make sure all required documents are ready before your appointment.";
    const chunks = splitSpeechText(text, 55);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 55)).toBe(true);
    expect(normalizeSpeechText(chunks.join(" "))).toBe(normalizeSpeechText(text));
  });
});

describe("selectSpeechVoice", () => {
  const voices: SpeechVoiceLike[] = [
    { lang: "en-GB" },
    { lang: "ar-SA" },
    { lang: "fr-FR", default: true },
    { lang: "ar-EG" },
  ];

  it("prefers an exact locale match", () => {
    expect(selectSpeechVoice(voices, "ar-EG")).toEqual({ lang: "ar-EG" });
  });

  it("falls back to the same base language", () => {
    expect(selectSpeechVoice(voices, "en-US")).toEqual({ lang: "en-GB" });
  });

  it("falls back to the default voice", () => {
    expect(selectSpeechVoice(voices, "zh-CN")).toEqual({
      lang: "fr-FR",
      default: true,
    });
  });
});
