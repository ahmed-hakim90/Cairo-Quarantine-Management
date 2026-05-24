import { describe, expect, it } from "vitest";
import { VACCINES_BY_CATEGORY } from "@/data/vaccines";
import { isChatAllowedUrl } from "@/lib/chat/allowed-links";
import { enforceResponseRules } from "@/lib/chat/enforce-response";
import { isHumanHandoffRequest } from "@/lib/chat/human-handoff";
import { resolveEffectiveQuery } from "@/lib/chat/conversation-context";
import { classifyChatIntent } from "@/lib/chat/intent";
import { isOfficeOrAreaQuery } from "@/lib/chat/office-area-query";
import { getLocalChatResponse } from "@/lib/chat/local-responses";
import {
  applyPortalAssistantRules,
  resolvePortalAssistant,
} from "@/lib/chat/portal-assistant";
import type { DestinationCountry, Office } from "@/lib/office-requests/types";
import { isBookingQuestion } from "@/lib/chat/intent";
import { isOutOfScopeMessage } from "@/lib/chat/out-of-scope";
import { buildOfficeResponse } from "@/lib/chat/office-response";
import { resolveChatMessageForAssistant } from "@/lib/chat/conversation-context";
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

function localAr(
  message: string,
  extra: {
    knowledgeIndex?: SiteKnowledgeEntry[];
    destinationCountries?: DestinationCountry[];
    portalOffices?: Office[];
  } = {},
) {
  return getLocalChatResponse({
    locale: "ar",
    message,
    knowledgeIndex: extra.knowledgeIndex ?? [],
    destinationCountries: extra.destinationCountries,
    portalOffices: extra.portalOffices,
    vaccinesByCategory: VACCINES_BY_CATEGORY,
  });
}

describe("chat rules", () => {
  it("detects out-of-scope medical questions", () => {
    expect(isOutOfScopeMessage("عندي حرارة وغثيان")).toBe(true);
    expect(isOutOfScopeMessage("كيف أحجز موعد")).toBe(false);
  });

  it("does not block known office name المحكمة as out-of-scope", () => {
    expect(isOutOfScopeMessage("المحكمة")).toBe(false);
    expect(isOutOfScopeMessage("مكتب المحكمة")).toBe(false);
  });

  it("dedupes المحكمة to one entry in Nozha search", () => {
    const centers = findVaccinationCenters("مكتب في النزهه", 8);
    const court = centers.filter((c) =>
      normalizeArabic(c.centerNameAr).includes("المحكمه"),
    );
    expect(court).toHaveLength(1);
    expect(centers.some((c) => c.centerNameAr.includes("النزهة الجديدة"))).toBe(
      true,
    );
  });

  it("returns المحكمة for office name query", () => {
    expect(classifyChatIntent("المحكمة")).toBe("office");
    const reply = localAr("المحكمة");
    expect(reply?.type).toBe("office");
    expect(reply?.answer).toContain("المحكمة");
    expect(reply?.answer).toContain("maps.app.goo.gl");
    expect(reply?.answer).not.toContain("واتساب");
  });

  it("resolvePortalAssistant returns المحكمة office not whatsapp fallback", () => {
    const resolved = resolvePortalAssistant({
      locale: "ar",
      message: "مكتب المحكمة",
      knowledgeIndex: [],
      destinationCountries: [],
      portalOffices: [],
      vaccinesByCategory: VACCINES_BY_CATEGORY,
    });
    const final = applyPortalAssistantRules(resolved, "ar");
    expect(final.type).toBe("office");
    expect(final.answer).toContain("المحكمة");
    expect(final.answer).not.toContain(whatsappOutOfScopeMessage("ar"));
  });

  it("applyPortalAssistantRules keeps all Helwan offices in the reply", () => {
    const reply = localAr("مكتب في حلوان");
    expect(reply).not.toBeNull();
    const final = applyPortalAssistantRules(reply!, "ar");
    expect(final.answer).toContain("حدائق حلوان");
    expect(final.answer).toContain("الست خضرة");
    expect(final.answer).toContain("كل المكاتب");
  });

  it("chat catalog dedupes duplicate maps URLs", () => {
    const catalog = buildChatOfficeCatalog();
    const courtUrls = catalog.filter(
      (o) => normalizeArabic(o.centerNameAr) === "المحكمه",
    );
    expect(courtUrls).toHaveLength(1);
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

  it("merges follow-up area into prior office question", () => {
    const effective = resolveEffectiveQuery([
      { role: "user", content: "اقرب مكتب" },
      { role: "assistant", content: "اختر منطقة" },
      { role: "user", content: "وحلوان؟" },
    ]);
    expect(classifyChatIntent(effective.text)).toBe("office");
    const reply = localAr(effective.text);
    expect(reply?.type).toBe("office");
    expect(reply?.answer).toContain("حلوان");
  });

  it("classifies checkin and complaint info intents", () => {
    expect(classifyChatIntent("ازاي اسجل حضور")).toBe("checkin_info");
    expect(classifyChatIntent("عايز اقدم شكوى")).toBe("complaint_info");
    expect(classifyChatIntent("مسافر دولي ايه المطلوب")).toBe(
      "international_info",
    );
  });

  it("returns booking local response with markdown link", () => {
    const reply = localAr("كيف احجز موعد");
    expect(reply?.type).toBe("booking");
    expect(reply?.answer).toContain("[");
    expect(reply?.answer).toContain("/ar/booking");
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
    const reply = localAr("حلوان");
    expect(reply?.answer).toContain("حدائق حلوان");
    expect(reply?.answer).toContain("الست خضرة");
    expect(reply?.answer).toContain("maps.app.goo.gl");
  });

  it("returns all Tagamoa offices in New Cairo", () => {
    const centers = findVaccinationCenters("التجمع فيها مكاتب تاني", 8);
    expect(centers.length).toBe(3);
    expect(centers.every((c) => c.administrationAr === "القاهرة الجديدة")).toBe(
      true,
    );
  });

  it("office response includes tel and map links for Helwan", () => {
    const reply = localAr("مكتب تطعيم في حلوان ؟");
    expect(reply?.answer).toContain("tel:");
    expect(reply?.answer).toContain("maps.app.goo.gl");
    expect(reply?.answer).toContain("[اتصال]");
    expect(reply?.answer).toContain("[فتح الخريطة]");
  });

  it("office response lists multiple centres in the same area", () => {
    const reply = localAr("التجمع فيها مكاتب تاني");
    expect(reply?.answer).toContain("التجمع الاول");
    expect(reply?.answer).toContain("التجمع الثالث");
    expect(reply?.answer).toContain("التجمع الخامس");
  });

  it("buildOfficeResponse keeps clickable links after enforce", () => {
    const raw = buildOfficeResponse("ar", "مكتب في حلوان", []);
    const result = enforceResponseRules(raw, "ar", { maxLines: 24 });
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
    expect(unknown).toContain("تعذر العثور على المعلومات داخل المنصة");
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
    const reply = localAr("مسافر عمرة التطعيم بكام");
    expect(reply?.type).toBe("price");
    expect(reply?.answer).toContain("استرشادية");
    expect(reply?.answer).not.toContain("مكاتب في المنطقة");
  });

  it("returns specific bivalent meningococcal price", () => {
    const reply = localAr("بكم السحائي الثنائي");
    expect(reply?.type).toBe("price");
    expect(reply?.answer).toContain("200");
    expect(reply?.answer).toContain("الأسعار استرشادية");
  });

  it("returns seasonal influenza price", () => {
    const reply = localAr("سعر الإنفلونزا");
    expect(reply?.type).toBe("price");
    expect(reply?.answer).toContain("260");
  });

  it("returns hepatitis vaccination office hint", () => {
    const reply = localAr("أين يوجد تطعيم الكبد");
    expect(reply?.type).toBe("office");
    expect(reply?.answer).toContain("يمكن الحصول عليه من");
    expect(reply?.answer).toMatch(/مطار|الخريطة/);
  });

  it("returns destination vaccines for Afghanistan not offices", () => {
    const intent = classifyChatIntent("مسافر افغانستان هتطعم ايه", {
      destinationCountries: [mockAfghanistan],
    });
    expect(intent).toBe("destination_vaccines");
    const reply = localAr("مسافر افغانستان هتطعم ايه", {
      destinationCountries: [mockAfghanistan],
    });
    expect(reply?.answer).toContain("حمى صفراء");
    expect(reply?.answer).toContain("/ar/international-traveler");
    expect(reply?.answer).not.toContain("مكاتب في المنطقة");
  });

  it("returns hajj guide for instructions question not offices", () => {
    expect(isOfficeOrAreaQuery(normalizeArabic("ايه هي تعليمات الحج والعمرة"))).toBe(
      false,
    );
    const reply = localAr("ايه هي تعليمات الحج والعمرة");
    expect(reply?.type).toBe("vaccine");
    expect(reply?.answer).toContain("الحج والعمرة");
    expect(reply?.answer).toContain("/ar/hajj-umrah");
    expect(reply?.answer).not.toContain("مكاتب في المنطقة");
  });

  it("returns hajj guide for hajj vaccinations question not offices", () => {
    expect(classifyChatIntent("التطعيمات للحج")).toBe("hajj_umrah");
    const reply = localAr("التطعيمات للحج");
    expect(reply?.answer).toContain("الحج والعمرة");
    expect(reply?.answer).not.toContain("مكاتب في المنطقة");
  });

  it("returns hajj requirements with vaccine type", () => {
    const reply = localAr("متطلبات الحج");
    expect(reply?.type).toBe("vaccine");
    expect(reply?.source).toContain("حج");
  });

  it("returns Tagamoa offices for explicit office area query", () => {
    expect(classifyChatIntent("مكتب في التجمع")).toBe("office");
    const reply = localAr("مكتب في التجمع");
    expect(reply?.answer).toContain("التجمع");
    expect(reply?.answer).toContain("maps.app.goo.gl");
  });

  const mockHelwanOffice: Office = {
    id: "test-helwan",
    governorateId: "cairo",
    serialInGovernorate: 1,
    administrationAr: "حلوان",
    nameAr: "الست خضرة",
    addressAr: "شارع راغب من شارع برهان حلوان",
    phone: "0225550000",
    mapsUrl: "https://maps.app.goo.gl/test",
    service: "hajj_umrah_travelers",
    active: true,
    workingHours: { from: "08:00", to: "17:00" },
  };

  it("does not treat مواعيد as booking (موعد token only)", () => {
    expect(isBookingQuestion(normalizeArabic("مواعيد شغل مكتب حلوان"))).toBe(
      false,
    );
    expect(isBookingQuestion(normalizeArabic("كيف احجز موعد"))).toBe(true);
  });

  it("returns office hours for Helwan hours question", () => {
    expect(classifyChatIntent("مواعيد شغل مكتب حلوان")).toBe("office_hours");
    const reply = localAr("مواعيد شغل مكتب حلوان", {
      portalOffices: [mockHelwanOffice],
    });
    expect(reply?.answer).toContain("مواعيد العمل");
    expect(reply?.answer).toContain("حلوان");
    expect(reply?.answer).not.toContain("/ar/booking");
  });

  it("returns location not hours line for bare office query", () => {
    expect(classifyChatIntent("مكتب في حلوان")).toBe("office");
    const reply = localAr("مكتب في حلوان", {
      portalOffices: [mockHelwanOffice],
    });
    expect(reply?.answer).toContain("maps.app.goo.gl");
    expect(reply?.answer).not.toMatch(/مواعيد العمل:/);
  });

  it("returns services overview not offices for services question", () => {
    expect(classifyChatIntent("ايه هي الخدمات")).toBe("services");
    const reply = localAr("ايه هي الخدمات", {
      knowledgeIndex: [
        {
          id: "services",
          category: "services",
          title: "الخدمات",
          body: "خدمات المسافرين والحج والمواطنين.",
          path: "/ar",
          tags: ["خدمات"],
        },
      ],
    });
    expect(reply?.answer).toContain("خدمات");
    expect(reply?.answer).not.toContain("مكاتب في المنطقة");
  });

  it("resolvePortalAssistant returns unknown message without LLM", () => {
    const resolved = resolvePortalAssistant({
      locale: "ar",
      message: "ما هو رقم الطوارئ في اليابان",
      knowledgeIndex: [],
      destinationCountries: [],
      portalOffices: [],
      vaccinesByCategory: VACCINES_BY_CATEGORY,
    });
    const final = applyPortalAssistantRules(resolved, "ar");
    expect(final.confidence).toBe(0.5);
    expect(final.answer).toContain("تعذر العثور على المعلومات داخل المنصة");
    expect(final.type).toBe("contact");
  });

  it("does not rank sun protection first for vague step tokens", () => {
    const index: SiteKnowledgeEntry[] = [
      {
        id: "faq-sun",
        category: "faq",
        title: "حماية من الشمس",
        body: "استخدم المظلة أو القبعة، وارتدِ ملابس خفيفة وفضفاضة.",
        path: "/ar",
        tags: ["faq"],
      },
    ];
    const hits = searchSiteKnowledge("ايه الخطوات", index, 3);
    expect(hits[0]?.title).not.toBe("حماية من الشمس");
  });

  it("does not return sun protection FAQ for vague help question", () => {
    const resolved = resolvePortalAssistant({
      locale: "ar",
      message: "تقدر تساعدني في ايه",
      knowledgeIndex: [],
      destinationCountries: [],
      portalOffices: [],
      vaccinesByCategory: VACCINES_BY_CATEGORY,
    });
    expect(resolved.answer).not.toContain("المظلة");
    expect(resolved.answer).not.toContain("حماية من الشمس");
    expect(resolved.answer).toContain("الحجز");
  });

  it("returns booking steps for steps question", () => {
    expect(classifyChatIntent("ايه الخطوات")).toBe("booking_steps");
    const reply = localAr("ايه الخطوات");
    expect(reply?.answer).toContain("خطوات الحجز");
    expect(reply?.answer).not.toContain("المظلة");
    expect(reply?.answer).toContain("/ar/booking");
  });

  it("expands short steps follow-up after help question", () => {
    const expanded = resolveChatMessageForAssistant(
      [
        { role: "user", content: "تقدر تساعدني في ايه" },
        { role: "assistant", content: "يمكنني المساعدة في الخدمات والحجز." },
        { role: "user", content: "ايه الخطوات" },
      ],
      "ar",
    );
    expect(expanded).toBe("خطوات الحجز في البوابة");
    expect(classifyChatIntent(expanded)).toBe("booking_steps");
  });

  it("keeps destination vaccines intent for country question with ايه", () => {
    expect(
      classifyChatIntent("مسافر افغانستان هتطعم ايه", {
        destinationCountries: [mockAfghanistan],
      }),
    ).toBe("destination_vaccines");
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
