import { describe, expect, it } from "vitest";
import {
  aggregateDailyPublicStats,
  computeDailyStatsDelta,
  countActiveSessions,
  incrementDailyStatsForAction,
  maskPhoneForAnalytics,
  parsePublicAnalyticsIngestBody,
  shouldPersistPublicAnalyticsEvent,
} from "@/lib/analytics/public-event-schema";
import { shouldArchivePublicEventData } from "@/lib/analytics/public-analytics-store";
import { Timestamp } from "firebase-admin/firestore";

describe("public analytics schema", () => {
  it("accepts valid ingest payloads", () => {
    const sessionId = "550e8400-e29b-41d4-a716-446655440000";
    const parsed = parsePublicAnalyticsIngestBody({
      sessionId,
      action: "page.view",
      path: "/ar/booking",
      locale: "ar",
      meta: { formType: "booking", step: "office" },
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.sessionId).toBe(sessionId);
      expect(parsed.value.meta?.formType).toBe("booking");
    }
  });

  it("rejects invalid session ids and paths", () => {
    expect(
      parsePublicAnalyticsIngestBody({
        sessionId: "bad",
        action: "page.view",
        path: "/ar",
        locale: "ar",
      }).ok,
    ).toBe(false);
    expect(
      parsePublicAnalyticsIngestBody({
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
        action: "page.view",
        path: "ar/booking",
        locale: "ar",
      }).ok,
    ).toBe(false);
  });

  it("masks phone numbers for analytics", () => {
    expect(maskPhoneForAnalytics("01012345678")).toBe("***5678");
    expect(maskPhoneForAnalytics("12")).toBe("***");
  });

  it("maps actions to daily stat deltas", () => {
    expect(incrementDailyStatsForAction("page.view", "/ar/booking")).toEqual({
      pageViews: 1,
      pathIncrement: "/ar/booking",
    });
    expect(incrementDailyStatsForAction("form.submit_error", "/ar/booking")).toEqual({
      formErrors: 1,
    });
  });

  it("dedupes unique visitors and page views per day", () => {
    const sessionId = "550e8400-e29b-41d4-a716-446655440000";
    const base = {
      sessionId,
      path: "/ar/booking",
      locale: "ar" as const,
    };
    const today = "2026-05-24";

    const first = computeDailyStatsDelta(
      { ...base, action: "page.view" },
      undefined,
      today,
    );
    expect(first.delta).toEqual({
      uniqueSessions: 1,
      pageViews: 1,
      pathIncrement: "/ar/booking",
    });

    const repeatPage = computeDailyStatsDelta(
      { ...base, action: "page.view" },
      {
        statsDate: today,
        pathsCountedToday: { "/ar/booking": true },
      },
      today,
    );
    expect(repeatPage.delta).toEqual({});

    const newPath = computeDailyStatsDelta(
      { ...base, action: "page.view", path: "/ar/checkin" },
      {
        statsDate: today,
        pathsCountedToday: { "/ar/booking": true },
      },
      today,
    );
    expect(newPath.delta).toEqual({
      pageViews: 1,
      pathIncrement: "/ar/checkin",
    });
  });

  it("only persists high-signal analytics events", () => {
    expect(shouldPersistPublicAnalyticsEvent("page.view")).toBe(false);
    expect(shouldPersistPublicAnalyticsEvent("session.heartbeat")).toBe(false);
    expect(shouldPersistPublicAnalyticsEvent("form.submit_error")).toBe(true);
    expect(shouldPersistPublicAnalyticsEvent("form.abandon")).toBe(true);
  });

  it("aggregates daily public stats across days", () => {
    const merged = aggregateDailyPublicStats([
      {
        date: "2026-05-20",
        pageViews: 10,
        uniqueSessions: 4,
        totalSessionSeconds: 400,
        avgSessionSeconds: 0,
        byPath: { "/ar/booking": 6 },
        formStarts: 2,
        formSubmits: 1,
        formAbandonments: 1,
        formErrors: 0,
        apiErrors: 0,
        activeNowPeak: 3,
      },
      {
        date: "2026-05-21",
        pageViews: 5,
        uniqueSessions: 2,
        totalSessionSeconds: 120,
        avgSessionSeconds: 0,
        byPath: { "/ar/booking": 2, "/ar/checkin": 1 },
        formStarts: 1,
        formSubmits: 1,
        formAbandonments: 0,
        formErrors: 1,
        apiErrors: 0,
        activeNowPeak: 2,
      },
    ]);
    expect(merged.pageViews).toBe(15);
    expect(merged.uniqueSessions).toBe(6);
    expect(merged.avgSessionSeconds).toBe(Math.round(520 / 6));
    expect(merged.byPath["/ar/booking"]).toBe(8);
    expect(merged.formErrors).toBe(1);
  });

  it("counts active sessions within window", () => {
    const now = Date.parse("2026-05-24T12:00:00.000Z");
    const count = countActiveSessions(
      [
        { lastSeenAt: "2026-05-24T11:58:00.000Z" },
        { lastSeenAt: "2026-05-24T11:50:00.000Z" },
      ],
      now,
      3 * 60 * 1000,
    );
    expect(count).toBe(1);
  });

  it("archives old public events", () => {
    const cutoff = new Date("2026-02-01T00:00:00.000Z");
    expect(
      shouldArchivePublicEventData(
        { createdAt: Timestamp.fromDate(new Date("2026-01-01T00:00:00.000Z")) },
        cutoff,
      ),
    ).toBe(true);
    expect(
      shouldArchivePublicEventData(
        { createdAt: Timestamp.fromDate(new Date("2026-03-01T00:00:00.000Z")) },
        cutoff,
      ),
    ).toBe(false);
  });
});
