import { describe, expect, it } from "vitest";
import { localizeCheckinError } from "@/lib/i18n/checkin-copy";

describe("localizeCheckinError", () => {
  it("returns English rate limit message", () => {
    expect(
      localizeCheckinError("en", "تم تجاوز عدد المحاولات. انتظر قليلاً ثم حاول مرة أخرى.", "checkinFailed"),
    ).toBe("Too many attempts. Wait a moment and try again.");
  });

  it("returns fallback when message is unknown", () => {
    expect(localizeCheckinError("en", "خطأ غير معروف", "quickFailed")).toBe(
      "خطأ غير معروف",
    );
  });
});
