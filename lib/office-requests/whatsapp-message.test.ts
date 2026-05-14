import { describe, expect, it } from "vitest";
import {
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

describe("whatsappUrl", () => {
  it("embeds normalized digits in wa.me path", () => {
    const u = whatsappUrl("01012345678", "مرحبا");
    expect(u).toMatch(/^https:\/\/wa\.me\/201012345678\?text=/);
    expect(decodeURIComponent(u.split("text=")[1] ?? "")).toBe("مرحبا");
  });
});
