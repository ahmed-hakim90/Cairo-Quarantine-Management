import { describe, expect, it } from "vitest";
import {
  filterBookingOfficesForGovernorateAndTravelerState,
  filterOfficesForGovernorate,
} from "@/lib/office-requests/office-governorate";
import type { Office } from "@/lib/office-requests/types";

function office(partial: Partial<Office> & Pick<Office, "id">): Office {
  return {
    id: partial.id,
    governorateId: partial.governorateId ?? "cairo",
    serialInGovernorate: partial.serialInGovernorate ?? 1,
    administrationAr: partial.administrationAr ?? "إدارة",
    nameAr: partial.nameAr ?? partial.id,
    addressAr: partial.addressAr ?? "عنوان",
    phone: partial.phone ?? null,
    mapsUrl: partial.mapsUrl ?? "https://example.com",
    service: partial.service ?? "hajj_umrah_travelers",
    active: partial.active ?? true,
    travelerStateIds: partial.travelerStateIds,
  };
}

describe("office governorate filters", () => {
  const offices = [
    office({ id: "cairo-international", governorateId: "cairo" }),
    office({
      id: "cairo-hajj",
      governorateId: "cairo",
      service: "hajj_umrah_only",
    }),
    office({ id: "giza-international", governorateId: "giza" }),
  ];

  it("filters follow-up offices by governorate only", () => {
    expect(filterOfficesForGovernorate(offices, "cairo").map((o) => o.id)).toEqual([
      "cairo-international",
      "cairo-hajj",
    ]);
  });

  it("returns no booking offices until traveller state is selected", () => {
    expect(
      filterBookingOfficesForGovernorateAndTravelerState(offices, "cairo", ""),
    ).toEqual([]);
  });

  it("filters booking offices by governorate and traveller state", () => {
    expect(
      filterBookingOfficesForGovernorateAndTravelerState(
        offices,
        "cairo",
        "international",
      ).map((o) => o.id),
    ).toEqual(["cairo-international"]);
  });
});
