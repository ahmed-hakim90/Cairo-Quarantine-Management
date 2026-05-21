import { describe, expect, it } from "vitest";
import { isChatAllowedUrl } from "@/lib/chat/allowed-links";
import { enforceResponseRules } from "@/lib/chat/enforce-response";
import { isHumanHandoffRequest } from "@/lib/chat/human-handoff";
import { classifyChatIntent } from "@/lib/chat/intent";
import { isOfficeOrAreaQuery } from "@/lib/chat/office-area-query";
import { getLocalChatResponse } from "@/lib/chat/local-responses";
import type { DestinationCountry } from "@/lib/office-requests/types";
import { isOutOfScopeMessage } from "@/lib/chat/out-of-scope";
import { buildOfficeResponse } from "@/lib/chat/office-response";
import {
  searchSiteKnowledge,
  type SiteKnowledgeEntry,
} from "@/lib/chat/site-knowledge";
import { findVaccinationCenters } from "@/lib/chat/vaccination-center-search";
import { buildChatOfficeCatalog } from "@/lib/chat/office-catalog";
import {
  whatsappHumanHandoffMessage,
  whatsappOutOfScopeMessage,
  whatsappUnknownInfoMessage,
} from "@/lib/chat/whatsapp-fallback";
import {
  buildWhatsappComplaintsUrl,
  formatWhatsappDisplayPhone,
} from "@/lib/site-contact";
import { normalizeArabic } from "@/lib/chat/normalize-arabic";

describe("chat rules", () => {
  it("detects out-of-scope medical questions", () => {
    expect(isOutOfScopeMessage("عندي حرارة وغثيان")).toBe(true);
    expect(isOutOfScopeMessage("كيف أحجز موعد")).toBe(false);
  });

  it("detects human handoff requests", () => {
    expect(isHumanHandoffRequest("عايز اكلم حد")).toBe(true);
    expect(isHumanHandoffRequest("عايز اتواصل مع حد")).toBe(true);
    expect(isHumanHandoffRequest("محتاج اتواصل مع شخص")).toBe(true);
    expect(isHumanHandoffRequest("كيف احجز موعد")).toBe(false);
  });

  it("detects bare area office queries", () => {
    expect(isOfficeOrAreaQuery(normalizeArabic("حلوان"))).toBe(true);
    expect(isOfficeOrAreaQuery(normalizeArabic("التجمع"))).toBe(true);
  });

  it("human handoff message includes wa.me link", () => {
    const prev = process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE;
    process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE = "201012345678";
    expect(whatsappHumanHandoffMessage("ar")).toContain("[فتح واتساب](https://wa.me/");
    process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE = prev;
  });

  it("merged catalog includes hajj-only offices", () => {
    const catalog = buildChatOfficeCatalog();
    expect(catalog.length).toBeGreaterThan(14);
    expect(catalog.some((o) => o.centerNameAr.includes("حدائق حلوان"))).toBe(
      true,
    );
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

  it("finds Helwan vaccination centers", () => {
    const centers = findVaccinationCenters("مكتب تطعيم في حلوان", 8);
    expect(centers.some((c) => c.administrationAr.includes("حلوان"))).toBe(true);
    expect(centers.some((c) => c.centerNameAr.includes("حدائق حلوان"))).toBe(
      true,
    );
  });

  it("returns multiple offices for bare Helwan query", () => {
    const reply = getLocalChatResponse({
      locale: "ar",
      message: "حلوان",
      knowledgeIndex: [],
    });
    expect(reply).toContain("حدائق حلوان");
    expect(reply).toContain("الست خضرة");
    expect(reply).toContain("maps.app.goo.gl");
  });

  it("returns all Tagamoa offices in New Cairo", () => {
    const centers = findVaccinationCenters("التجمع فيها مكاتب تاني", 8);
    expect(centers.length).toBe(3);
    expect(centers.every((c) => c.administrationAr === "القاهرة الجديدة")).toBe(
      true,
    );
  });

  it("office response includes tel and map links for Helwan", () => {
    const reply = getLocalChatResponse({
      locale: "ar",
      message: "مكتب تطعيم في حلوان ؟",
      knowledgeIndex: [],
    });
    expect(reply).toContain("tel:");
    expect(reply).toContain("maps.app.goo.gl");
    expect(reply).toContain("[اتصال]");
    expect(reply).toContain("[فتح الخريطة]");
  });

  it("office response lists multiple centres in the same area", () => {
    const reply = getLocalChatResponse({
      locale: "ar",
      message: "التجمع فيها مكاتب تاني",
      knowledgeIndex: [],
    });
    expect(reply).toContain("التجمع الاول");
    expect(reply).toContain("التجمع الثالث");
    expect(reply).toContain("التجمع الخامس");
  });

  it("buildOfficeResponse keeps clickable links after enforce", () => {
    const raw = buildOfficeResponse("ar", "مكتب في حلوان", []);
    const result = enforceResponseRules(raw, "ar", { maxLines: 16 });
    expect(result).toContain("tel:");
    expect(result).toContain("maps.app.goo.gl");
    expect(result).not.toMatch(/فتح الخريطة%2C/);
  });

  it("enforce keeps long google maps markdown links intact", () => {
    const longUrl =
      "https://www.google.com/maps/search/?api=1&query=%D8%A7%D9%84%D9%82%D8%B7%D8%A7%D9%85%D9%8A%D8%A9";
    const result = enforceResponseRules(
      `[فتح الخريطة](${longUrl})`,
      "ar",
      { maxLines: 4 },
    );
    expect(result).toContain("[فتح الخريطة](");
    expect(result).toContain("google.com/maps");
    expect(result).not.toContain("%2C%20%D8%A7");
  });

  it("allows tel and maps URLs", () => {
    expect(isChatAllowedUrl("tel:2025567079", "ar")).toBe(true);
    expect(isChatAllowedUrl("https://maps.app.goo.gl/GsBViG3R4jWCEnEC8", "ar")).toBe(
      true,
    );
    expect(isChatAllowedUrl("https://evil.example/phish", "ar")).toBe(false);
  });

  it("formats whatsapp display phone", () => {
    const prev = process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE;
    process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE = "201012345678";
    expect(formatWhatsappDisplayPhone()).toMatch(/^\+20 /);
    process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE = prev;
  });

  it("fallback messages include wa.me markdown link", () => {
    const prev = process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE;
    process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE = "201012345678";
    const out = whatsappOutOfScopeMessage("ar");
    const unknown = whatsappUnknownInfoMessage("ar");
    expect(out).toContain("[فتح واتساب](https://wa.me/");
    expect(unknown).toContain("[تواصل عبر واتساب](https://wa.me/");
    process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE = prev;
  });

  const mockAfghanistan: DestinationCountry = {
    id: "af",
    nameEn: "Afghanistan",
    nameAr: "أفغانستان",
    requirementsAr: "حمى صفراء إلزامية قبل السفر.",
    sortOrder: 1,
  };

  it("classifies umrah price question as price not office", () => {
    const intent = classifyChatIntent("مسافر عمرة التطعيم بكام");
    expect(intent).toBe("price");
    const reply = getLocalChatResponse({
      locale: "ar",
      message: "مسافر عمرة التطعيم بكام",
      knowledgeIndex: [],
    });
    expect(reply).toContain("أسعار");
    expect(reply).not.toContain("مكاتب في المنطقة");
  });

  it("returns destination vaccines for Afghanistan not offices", () => {
    const intent = classifyChatIntent("مسافر افغانستان هتطعم ايه", {
      destinationCountries: [mockAfghanistan],
    });
    expect(intent).toBe("destination_vaccines");
    const reply = getLocalChatResponse({
      locale: "ar",
      message: "مسافر افغانستان هتطعم ايه",
      knowledgeIndex: [],
      destinationCountries: [mockAfghanistan],
    });
    expect(reply).toContain("حمى صفراء");
    expect(reply).toContain("/ar/international-traveler");
    expect(reply).not.toContain("مكاتب في المنطقة");
  });

  it("returns hajj guide for instructions question not offices", () => {
    expect(isOfficeOrAreaQuery(normalizeArabic("ايه هي تعليمات الحج والعمرة"))).toBe(
      false,
    );
    const reply = getLocalChatResponse({
      locale: "ar",
      message: "ايه هي تعليمات الحج والعمرة",
      knowledgeIndex: [],
    });
    expect(reply).toContain("الحج والعمرة");
    expect(reply).toContain("/ar/hajj-umrah");
    expect(reply).not.toContain("مكاتب في المنطقة");
  });

  it("returns services overview not offices for services question", () => {
    expect(classifyChatIntent("ايه هي الخدمات")).toBe("services");
    const reply = getLocalChatResponse({
      locale: "ar",
      message: "ايه هي الخدمات",
      knowledgeIndex: [
        {
          id: "services",
          category: "pages",
          title: "الخدمات",
          body: "خدمات المسافرين والحج والمواطنين.",
          path: "/ar",
          tags: ["خدمات"],
        },
      ],
    });
    expect(reply).toContain("خدمات");
    expect(reply).not.toContain("مكاتب في المنطقة");
  });

  it("enforce-response keeps wa.me links", () => {
    const prev = process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE;
    process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE = "201012345678";
    const url = buildWhatsappComplaintsUrl();
    const result = enforceResponseRules(
      `للمساعدة:\n[فتح واتساب](${url})`,
      "ar",
    );
    expect(result).toContain("wa.me");
    process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE = prev;
  });
});
