import { describe, expect, it } from "vitest";
import {
  getTodayKey,
  normalizeRequestLookup,
  queueTicketId,
} from "@/lib/queue/queue-service";

describe("queue service helpers", () => {
  it("uses Cairo YYYY-MM-DD keys", () => {
    expect(getTodayKey(new Date("2026-05-17T00:30:00+03:00"))).toBe(
      "2026-05-17",
    );
  });

  it("builds deterministic ticket ids to prevent duplicate same-day checkins", () => {
    expect(
      queueTicketId({
        queueDate: "2026-05-17",
        officeId: "office-a",
        requestId: "req-1",
      }),
    ).toBe("2026-05-17_office-a_req-1");
  });

  it("normalizes request lookup values for request number and phone matching", () => {
    expect(normalizeRequestLookup("123")).toMatchObject({
      raw: "123",
      phone: "123",
      requestNumbers: ["123", "CQM-000123"],
    });
    expect(normalizeRequestLookup(" cqm-000123 ")).toMatchObject({
      raw: "cqm-000123",
      requestNumbers: ["CQM-000123", "000123"],
    });
  });
});

