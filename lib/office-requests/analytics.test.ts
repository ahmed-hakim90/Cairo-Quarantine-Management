import { describe, expect, it } from "vitest";
import { buildOfficePerformanceRatings } from "@/lib/office-requests/analytics";
import type { Office, OfficeRequest } from "@/lib/office-requests/types";

function office(id: string, nameAr = id): Office {
  return {
    id,
    administrationAr: "",
    nameAr,
    addressAr: "",
    phone: null,
    mapsUrl: "",
    service: "hajj_umrah_travelers",
    active: true,
  };
}

function request(
  id: string,
  officeId: string,
  status: OfficeRequest["status"],
): OfficeRequest {
  return {
    id,
    officeId,
    officeNameAr: officeId,
    type: "booking",
    status,
    name: "",
    phone: "",
    details: "",
    notes: "",
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-05-15T00:00:00.000Z",
  };
}

describe("buildOfficePerformanceRatings", () => {
  it("calculates score from completed and cancelled requests", () => {
    const ratings = buildOfficePerformanceRatings(
      [
        request("1", "office-a", "completed"),
        request("2", "office-a", "completed"),
        request("3", "office-a", "cancelled"),
      ],
      [office("office-a", "مكتب أ")],
    );

    expect(ratings[0]).toMatchObject({
      officeId: "office-a",
      total: 3,
      open: 0,
      completed: 2,
      cancelled: 1,
      score: 67,
    });
  });

  it("leaves score empty when an office has only open requests", () => {
    const ratings = buildOfficePerformanceRatings(
      [
        request("1", "office-a", "new"),
        request("2", "office-a", "in_progress"),
        request("3", "office-a", "contacted"),
      ],
      [office("office-a")],
    );

    expect(ratings[0]).toMatchObject({
      total: 3,
      open: 3,
      completed: 0,
      cancelled: 0,
      score: null,
    });
  });

  it("includes offices with no requests", () => {
    const ratings = buildOfficePerformanceRatings([], [office("office-a")]);

    expect(ratings[0]).toMatchObject({
      officeId: "office-a",
      total: 0,
      open: 0,
      completed: 0,
      cancelled: 0,
      score: null,
    });
  });

  it("sorts by score, then total, and sends unrated offices last", () => {
    const ratings = buildOfficePerformanceRatings(
      [
        request("1", "office-low", "completed"),
        request("2", "office-low", "cancelled"),
        request("3", "office-high-small", "completed"),
        request("4", "office-high-large", "completed"),
        request("5", "office-high-large", "completed"),
        request("6", "office-open", "new"),
      ],
      [
        office("office-open"),
        office("office-low"),
        office("office-high-small"),
        office("office-high-large"),
      ],
    );

    expect(ratings.map((rating) => rating.officeId)).toEqual([
      "office-high-large",
      "office-high-small",
      "office-low",
      "office-open",
    ]);
  });
});
