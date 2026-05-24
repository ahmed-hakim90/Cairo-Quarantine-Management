import { describe, expect, it } from "vitest";
import { VACCINES_BY_CATEGORY } from "@/data/vaccines";
import { resolveEffectiveQuery } from "@/lib/chat/conversation-context";
import { classifyChatIntent } from "@/lib/chat/intent";
import {
  applyPortalAssistantRules,
  resolvePortalAssistant,
} from "@/lib/chat/portal-assistant";
import { TRAINING_PHRASES_AR } from "@/lib/chat/training-phrases.ar";
import { whatsappUnknownInfoMessage } from "@/lib/chat/whatsapp-fallback";
import {
  EVAL_DESTINATION_COUNTRIES,
  MOCK_SAUDI,
  MOCK_TURKEY,
} from "@/lib/chat/eval/test-fixtures";
import phrases from "@/lib/chat/eval/phrases-ar.json";
import type { DestinationCountry, Office } from "@/lib/office-requests/types";

type EvalPhrase = {
  phrase: string;
  expectedIntent: string;
  mustNotContain?: string;
  mustContain?: string;
};

const EMPTY_OFFICES: Office[] = [];

function classifyOptions(phrase: string, expectedIntent?: string) {
  const needsDest =
    expectedIntent === "destination_vaccines" ||
    /تركيا|سعود|turkey|saudi/i.test(phrase);
  return {
    destinationCountries: needsDest ? EVAL_DESTINATION_COUNTRIES : [],
  };
}

describe("chat eval — training phrases", () => {
  for (const row of TRAINING_PHRASES_AR) {
    it(`intent: ${row.phrase}`, () => {
      const options =
        row.expectedIntent === "destination_vaccines"
          ? { destinationCountries: EVAL_DESTINATION_COUNTRIES }
          : undefined;
      expect(classifyChatIntent(row.phrase, options)).toBe(row.expectedIntent);
    });
  }
});

describe("chat eval — phrases-ar.json", () => {
  const rows = phrases as EvalPhrase[];

  it("has at least 50 evaluation phrases", () => {
    expect(rows.length).toBeGreaterThanOrEqual(50);
  });

  for (const row of rows) {
    it(`classify: ${row.phrase.slice(0, 40)}`, () => {
      expect(
        classifyChatIntent(row.phrase, classifyOptions(row.phrase, row.expectedIntent)),
      ).toBe(row.expectedIntent);
    });
  }
});

describe("chat eval — resolvePortalAssistant", () => {
  const rows = (phrases as EvalPhrase[]).filter((r) => r.mustNotContain);

  for (const row of rows) {
    it(`responds in-portal: ${row.phrase.slice(0, 40)}`, () => {
      const options = classifyOptions(row.phrase, row.expectedIntent);
      const resolved = resolvePortalAssistant({
        locale: "ar",
        message: row.phrase,
        knowledgeIndex: [],
        destinationCountries: options.destinationCountries,
        portalOffices: EMPTY_OFFICES,
        vaccinesByCategory: VACCINES_BY_CATEGORY,
      });
      const final = applyPortalAssistantRules(resolved, "ar");
      expect(final.answer).not.toContain(row.mustNotContain!);
      expect(final.answer).not.toBe(whatsappUnknownInfoMessage("ar"));
    });
  }

  it("answers destination vaccines for Turkey", () => {
    const resolved = resolvePortalAssistant({
      locale: "ar",
      message: "مسافر لتركيا ايه اللقاحات",
      knowledgeIndex: [],
      destinationCountries: [MOCK_TURKEY],
      portalOffices: EMPTY_OFFICES,
      vaccinesByCategory: VACCINES_BY_CATEGORY,
    });
    const final = applyPortalAssistantRules(resolved, "ar");
    expect(final.answer).toContain("تركيا");
    expect(final.answer).not.toContain("تعذر العثور");
  });

  it("answers destination vaccines for Saudi Arabia", () => {
    const resolved = resolvePortalAssistant({
      locale: "ar",
      message: "تطعيمات السفر للسعودية",
      knowledgeIndex: [],
      destinationCountries: [MOCK_SAUDI],
      portalOffices: EMPTY_OFFICES,
      vaccinesByCategory: VACCINES_BY_CATEGORY,
    });
    const final = applyPortalAssistantRules(resolved, "ar");
    expect(final.answer).toContain("السعودية");
  });
});

describe("chat eval — conversation follow-up", () => {
  it("merges short area follow-up after office question", () => {
    const effective = resolveEffectiveQuery([
      { role: "user", content: "اقرب مكتب" },
      { role: "assistant", content: "اختر منطقة" },
      { role: "user", content: "وحلوان؟" },
    ]);
    expect(effective.text).toContain("حلوان");
    expect(classifyChatIntent(effective.text)).toBe("office");
  });

  it("resolvePortalAssistant handles two-turn office query", () => {
    const resolved = resolvePortalAssistant({
      locale: "ar",
      message: "وحلوان؟",
      messages: [
        { role: "user", content: "اقرب مكتب" },
        { role: "assistant", content: "..." },
        { role: "user", content: "وحلوان؟" },
      ],
      knowledgeIndex: [],
      destinationCountries: [],
      portalOffices: EMPTY_OFFICES,
      vaccinesByCategory: VACCINES_BY_CATEGORY,
    });
    const final = applyPortalAssistantRules(resolved, "ar");
    expect(final.type).toBe("office");
    expect(final.answer).toContain("حلوان");
    expect(final.answer).not.toContain("تعذر العثور");
  });
});
