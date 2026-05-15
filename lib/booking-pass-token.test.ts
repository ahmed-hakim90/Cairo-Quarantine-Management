import { describe, expect, it } from "vitest";
import {
  bookingPassTokenExpiresAt,
  isBookingPassTokenExpired,
  passTokensMatch,
} from "@/lib/booking-pass-token";

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

describe("booking pass token expiry", () => {
  it("expires tokens 30 days after creation", () => {
    const createdAt = new Date("2026-05-01T00:00:00.000Z");
    expect(bookingPassTokenExpiresAt(createdAt).toISOString()).toBe(
      "2026-05-31T00:00:00.000Z",
    );
  });

  it("treats tokens as valid before expiry and expired at expiry", () => {
    const expiresAt = new Date("2026-05-31T00:00:00.000Z");
    expect(
      isBookingPassTokenExpired(
        expiresAt,
        new Date("2026-05-30T23:59:59.000Z"),
      ),
    ).toBe(false);
    expect(
      isBookingPassTokenExpired(
        expiresAt,
        new Date("2026-05-31T00:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("treats missing expiry as expired", () => {
    expect(isBookingPassTokenExpired(null)).toBe(true);
  });
});
