import { describe, expect, it } from "vitest";
import { buildOfficePerformanceRatings } from "@/lib/office-requests/analytics";
import type { Office, OfficeRequest } from "@/lib/office-requests/types";

function office(id: string, nameAr = id): Office {
  return {
    id,
    serialInGovernorate: 1,
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
  type: OfficeRequest["type"] = "booking",
): OfficeRequest {
  return {
    id,
    officeId,
    officeNameAr: officeId,
    type,
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
  it("counts bookings and complaints per office", () => {
    const ratings = buildOfficePerformanceRatings(
      [
        request("1", "office-a", "completed"),
        request("2", "office-a", "new"),
        request("3", "office-a", "cancelled", "complaint"),
        request("4", "office-a", "new", "proposal"),
      ],
      [office("office-a", "مكتب أ")],
    );

    expect(ratings[0]).toMatchObject({
      officeId: "office-a",
      bookings: 2,
      complaints: 2,
    });
  });

  it("keeps offices with no requests at zero", () => {
    const ratings = buildOfficePerformanceRatings([], [office("office-a")]);

    expect(ratings[0]).toMatchObject({
      officeId: "office-a",
      bookings: 0,
      complaints: 0,
    });
  });

  it("sorts by total activity, then bookings, then name", () => {
    const ratings = buildOfficePerformanceRatings(
      [
        request("1", "office-low", "completed"),
        request("2", "office-low", "cancelled", "complaint"),
        request("3", "office-high-bookings", "completed"),
        request("4", "office-high-bookings", "new"),
        request("5", "office-high-complaints", "new", "complaint"),
        request("6", "office-high-complaints", "new", "proposal"),
      ],
      [
        office("office-empty"),
        office("office-low"),
        office("office-high-bookings"),
        office("office-high-complaints"),
      ],
    );

    expect(ratings.map((rating) => rating.officeId)).toEqual([
      "office-high-bookings",
      "office-low",
      "office-high-complaints",
      "office-empty",
    ]);
  });
});
