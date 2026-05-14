import { describe, expect, it } from "vitest";
import { passTokensMatch } from "@/lib/booking-pass-token";

describe("passTokensMatch", () => {
  it("returns true for identical secrets", () => {
    const t = "a".repeat(32);
    expect(passTokensMatch(t, t)).toBe(true);
  });

  it("returns false when lengths differ", () => {
    expect(passTokensMatch("abc", "abcd")).toBe(false);
  });

  it("returns false for same length mismatch", () => {
    const a = "x".repeat(24);
    const b = "y".repeat(24);
    expect(passTokensMatch(a, b)).toBe(false);
  });

  it("returns false for empty stored", () => {
    expect(passTokensMatch("", "anything")).toBe(false);
  });
});
