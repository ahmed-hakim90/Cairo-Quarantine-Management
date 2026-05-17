import { describe, expect, it } from "vitest";
import type { Office } from "@/lib/office-requests/types";
import {
  deriveTravelerStateIdsFromService,
  effectiveOfficeService,
  filterOfficesForTravelerState,
  getOfficeTravelerStateIds,
  inferOfficeServiceFromSelectedTravelerStateIds,
  officeAcceptsTravelerState,
} from "@/lib/office-requests/office-traveler-state";

const base: Omit<Office, "service" | "travelerStateIds"> = {
  id: "x",
  serialInGovernorate: 1,
  administrationAr: "إدارة",
  nameAr: "مكتب",
  addressAr: "عنوان",
  phone: null,
  mapsUrl: "https://example.com",
  active: true,
};

const travelersOffice: Office = { ...base, id: "t", service: "hajj_umrah_travelers" };
const umrahOnlyOffice: Office = { ...base, id: "u", service: "hajj_umrah_only" };

describe("inferOfficeServiceFromSelectedTravelerStateIds", () => {
  it("returns hajj_umrah_travelers when international is selected", () => {
    expect(inferOfficeServiceFromSelectedTravelerStateIds(["international"])).toBe(
      "hajj_umrah_travelers",
    );
    expect(
      inferOfficeServiceFromSelectedTravelerStateIds([
        "hajj_umrah",
        "international",
      ]),
    ).toBe("hajj_umrah_travelers");
  });

  it("returns hajj_umrah_only when international is absent", () => {
    expect(
      inferOfficeServiceFromSelectedTravelerStateIds(["hajj_umrah", "citizen"]),
    ).toBe("hajj_umrah_only");
    expect(inferOfficeServiceFromSelectedTravelerStateIds(["custom"])).toBe(
      "hajj_umrah_only",
    );
  });
});

describe("deriveTravelerStateIdsFromService", () => {
  it("includes international only for hajj_umrah_travelers", () => {
    expect(deriveTravelerStateIdsFromService("hajj_umrah_travelers")).toEqual([
      "international",
      "hajj_umrah",
      "citizen",
    ]);
  });

  it("excludes international for hajj_umrah_only", () => {
    expect(deriveTravelerStateIdsFromService("hajj_umrah_only")).toEqual([
      "hajj_umrah",
      "citizen",
    ]);
  });
});

describe("getOfficeTravelerStateIds", () => {
  it("uses persisted travelerStateIds when non-empty", () => {
    const office: Office = {
      ...travelersOffice,
      travelerStateIds: ["custom-a", "custom-b"],
    };
    expect(getOfficeTravelerStateIds(office)).toEqual(["custom-a", "custom-b"]);
  });

  it("derives from service when travelerStateIds absent", () => {
    expect(getOfficeTravelerStateIds(travelersOffice)).toEqual(
      deriveTravelerStateIdsFromService("hajj_umrah_travelers"),
    );
  });
});

describe("effectiveOfficeService", () => {
  it("follows persisted travelerStateIds when they disagree with service", () => {
    const drift: Office = {
      ...umrahOnlyOffice,
      travelerStateIds: ["international", "hajj_umrah", "citizen"],
    };
    expect(effectiveOfficeService(drift)).toBe("hajj_umrah_travelers");
  });

  it("matches service when travelerStateIds are absent", () => {
    expect(effectiveOfficeService(umrahOnlyOffice)).toBe("hajj_umrah_only");
    expect(effectiveOfficeService(travelersOffice)).toBe("hajj_umrah_travelers");
  });
});

describe("officeAcceptsTravelerState", () => {
  it("matches derived service rules", () => {
    expect(officeAcceptsTravelerState(travelersOffice, "international")).toBe(
      true,
    );
    expect(officeAcceptsTravelerState(umrahOnlyOffice, "international")).toBe(
      false,
    );
    expect(officeAcceptsTravelerState(umrahOnlyOffice, "hajj_umrah")).toBe(true);
    expect(officeAcceptsTravelerState(umrahOnlyOffice, "citizen")).toBe(true);
  });
});

describe("filterOfficesForTravelerState", () => {
  it("filters international to travelers offices only", () => {
    expect(
      filterOfficesForTravelerState(
        [travelersOffice, umrahOnlyOffice],
        "international",
      ),
    ).toEqual([travelersOffice]);
  });

  it("includes both offices for hajj_umrah and citizen", () => {
    const list = [travelersOffice, umrahOnlyOffice];
    expect(filterOfficesForTravelerState(list, "hajj_umrah")).toEqual(list);
    expect(filterOfficesForTravelerState(list, "citizen")).toEqual(list);
  });
});
