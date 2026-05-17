import { describe, expect, it } from "vitest";
import {
  normalizePhoneForStorage,
  phoneLookupVariants,
  toWhatsappWaMeDigits,
  whatsappUrl,
} from "@/lib/office-requests/whatsapp-message";

describe("toWhatsappWaMeDigits", () => {
  it("converts Egyptian local 01… to 20…", () => {
    expect(toWhatsappWaMeDigits("01012345678")).toBe("201012345678");
  });

  it("strips separators and keeps international 20…", () => {
    expect(toWhatsappWaMeDigits("+20 10 1234 5678")).toBe("201012345678");
  });

  it("leaves already-international numbers starting with 20", () => {
    expect(toWhatsappWaMeDigits("201012345678")).toBe("201012345678");
  });

  it("handles 0020… prefix", () => {
    expect(toWhatsappWaMeDigits("00201012345678")).toBe("201012345678");
  });

  it("fills missing leading 0 on 10-digit mobile", () => {
    expect(toWhatsappWaMeDigits("1012345678")).toBe("201012345678");
  });

  it("returns empty for non-digit content", () => {
    expect(toWhatsappWaMeDigits("")).toBe("");
    expect(toWhatsappWaMeDigits("   ")).toBe("");
    expect(toWhatsappWaMeDigits("abc")).toBe("");
  });
});

describe("normalizePhoneForStorage", () => {
  it("stores Egyptian local numbers in +20 form", () => {
    expect(normalizePhoneForStorage("01552900017")).toBe("+201552900017");
  });

  it("keeps Egyptian international numbers in +20 form", () => {
    expect(normalizePhoneForStorage("201552900017")).toBe("+201552900017");
    expect(normalizePhoneForStorage("+20 155 290 0017")).toBe("+201552900017");
  });
});

describe("phoneLookupVariants", () => {
  it("matches local input against stored international variants", () => {
    expect(phoneLookupVariants("01552900017")).toEqual(
      expect.arrayContaining([
        "01552900017",
        "1552900017",
        "201552900017",
        "+201552900017",
        "00201552900017",
      ]),
    );
  });

  it("matches international input against local variants", () => {
    expect(phoneLookupVariants("+201552900017")).toEqual(
      expect.arrayContaining(["+201552900017", "201552900017", "01552900017"]),
    );
  });
});

describe("whatsappUrl", () => {
  it("embeds normalized digits in wa.me path", () => {
    const u = whatsappUrl("01012345678", "مرحبا");
    expect(u).toMatch(/^https:\/\/wa\.me\/201012345678\?text=/);
    expect(decodeURIComponent(u.split("text=")[1] ?? "")).toBe("مرحبا");
  });
});
