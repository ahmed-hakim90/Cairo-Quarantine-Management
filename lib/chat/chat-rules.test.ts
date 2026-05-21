import { describe, expect, it } from "vitest";
import { enforceResponseRules } from "@/lib/chat/enforce-response";
import { isOutOfScopeMessage } from "@/lib/chat/out-of-scope";
import { getLocalChatResponse } from "@/lib/chat/local-responses";
import {
  searchSiteKnowledge,
  type SiteKnowledgeEntry,
} from "@/lib/chat/site-knowledge";
import { formatWhatsappDisplayPhone } from "@/lib/site-contact";

describe("chat rules", () => {
  it("detects out-of-scope medical questions", () => {
    expect(isOutOfScopeMessage("عندي حرارة وغثيان")).toBe(true);
    expect(isOutOfScopeMessage("كيف أحجز موعد")).toBe(false);
  });

  it("enforces max four lines and removes hedging", () => {
    const result = enforceResponseRules(
      "أعتقد\nربما\nسطر3\nسطر4\nسطر5",
      "ar",
    );
    expect(result.split("\n").length).toBeLessThanOrEqual(4);
    expect(result).not.toContain("أعتقد");
  });

  it("returns booking local response with markdown link", () => {
    const reply = getLocalChatResponse({
      locale: "ar",
      message: "كيف احجز موعد",
      knowledgeIndex: [],
    });
    expect(reply).toContain("[");
    expect(reply).toContain("/ar/booking");
  });

  it("finds booking in knowledge search", () => {
    const index: SiteKnowledgeEntry[] = [
      {
        id: "booking",
        category: "pages",
        title: "حجز",
        body: "حجز موعد تطعيم",
        path: "/ar/booking",
        tags: ["حجز", "booking"],
      },
    ];
    const hits = searchSiteKnowledge("حجز موعد", index, 3);
    expect(hits.some((h) => h.id === "booking")).toBe(true);
  });

  it("formats whatsapp display phone", () => {
    const prev = process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE;
    process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE = "201012345678";
    expect(formatWhatsappDisplayPhone()).toMatch(/^\+20 /);
    process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE = prev;
  });
});
