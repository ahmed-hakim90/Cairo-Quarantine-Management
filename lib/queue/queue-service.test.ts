import { describe, expect, it } from "vitest";
import type { OfficeRequest } from "@/lib/office-requests/types";
import {
  getTodayKey,
  normalizeRequestLookup,
  queueTicketId,
  toQueueRequestSummary,
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
      phoneVariants: ["123"],
      requestNumbers: ["123", "CQM-000123"],
    });
    expect(normalizeRequestLookup(" cqm-000123 ")).toMatchObject({
      raw: "cqm-000123",
      requestNumbers: ["cqm-000123", "CQM-000123", "000123"],
    });
    expect(normalizeRequestLookup(" cairo-trav-17-000001 ")).toMatchObject({
      raw: "cairo-trav-17-000001",
      requestNumbers: [
        "cairo-trav-17-000001",
        "CAIRO-TRAV-17-000001",
        "17000001",
        "CQM-17000001",
      ],
    });
    expect(normalizeRequestLookup("01552900017").phoneVariants).toEqual(
      expect.arrayContaining(["01552900017", "+201552900017"]),
    );
    expect(normalizeRequestLookup("+201552900017").phoneVariants).toEqual(
      expect.arrayContaining(["01552900017", "+201552900017"]),
    );
  });

  it("maps office request fields for queue search display", () => {
    const request = {
      id: "req-1",
      requestNumber: "CQM-000042",
      name: "أحمد",
      phone: "01552900017",
      officeId: "office-a",
      officeNameAr: "مكتب",
      type: "booking",
      status: "new",
      preferredDate: "2026-05-20",
      details: "تفاصيل",
      notes: "ملاحظة",
      createdAt: "2026-05-17T10:00:00.000Z",
      updatedAt: "2026-05-17T10:00:00.000Z",
    } satisfies OfficeRequest;

    expect(toQueueRequestSummary(request)).toEqual({
      id: "req-1",
      requestNumber: "CQM-000042",
      name: "أحمد",
      phone: "01552900017",
      type: "booking",
      status: "new",
      preferredDate: "2026-05-20",
      details: "تفاصيل",
      notes: "ملاحظة",
      createdAt: "2026-05-17T10:00:00.000Z",
    });
  });
});
