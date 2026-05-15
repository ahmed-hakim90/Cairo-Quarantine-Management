import { describe, expect, it, beforeEach } from "vitest";
import {
  checkRateLimit,
  rateLimitKeyFromHeaders,
  resetRateLimitForTests,
} from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });

  it("allows requests until the limit then returns retry metadata", () => {
    expect(
      checkRateLimit({ key: "status:1", limit: 2, windowMs: 1000, now: 0 }),
    ).toMatchObject({ allowed: true, remaining: 1 });
    expect(
      checkRateLimit({ key: "status:1", limit: 2, windowMs: 1000, now: 10 }),
    ).toMatchObject({ allowed: true, remaining: 0 });
    expect(
      checkRateLimit({ key: "status:1", limit: 2, windowMs: 1000, now: 20 }),
    ).toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 1,
    });
  });

  it("opens a new window after reset", () => {
    expect(
      checkRateLimit({ key: "availability:1", limit: 1, windowMs: 100, now: 0 }),
    ).toMatchObject({ allowed: true });
    expect(
      checkRateLimit({
        key: "availability:1",
        limit: 1,
        windowMs: 100,
        now: 101,
      }),
    ).toMatchObject({ allowed: true, remaining: 0 });
  });
});

describe("rateLimitKeyFromHeaders", () => {
  it("uses the first forwarded IP with the provided scope", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 198.51.100.2",
    });
    expect(rateLimitKeyFromHeaders(headers, "status")).toBe(
      "status:203.0.113.10",
    );
  });
});
