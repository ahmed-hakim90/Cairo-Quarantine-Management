import { describe, expect, it } from "vitest";
import {
  CAIRO_AIRPORT_VACCINATION_OFFICE_ID,
  getOfficeWorkingHoursAdminPreview,
  getOfficeWorkingHoursTableLabel,
  parseOfficeWorkingHoursFromForm,
} from "@/lib/office-working-hours";
import type { Office } from "@/lib/office-requests/types";

const baseOffice = (overrides: Partial<Office> = {}): Office => ({
  id: "cairo-trav-2",
  governorateId: "cairo",
  serialInGovernorate: 2,
  administrationAr: "إدارة",
  nameAr: "مكتب",
  addressAr: "عنوان",
  phone: null,
  mapsUrl: "https://maps.example",
  service: "hajj_umrah_travelers",
  active: true,
  ...overrides,
});

describe("getOfficeWorkingHoursTableLabel", () => {
  it("returns standard charter hours for offices without workingHours", () => {
    expect(getOfficeWorkingHoursTableLabel(baseOffice(), "ar")).toBe(
      "٨ صباحًا – ٥ مساءً (الجُمع والعطلات الرسمية)",
    );
  });

  it("returns 24/7 line for Cairo airport office by legacy id", () => {
    expect(
      getOfficeWorkingHoursTableLabel(
        baseOffice({ id: CAIRO_AIRPORT_VACCINATION_OFFICE_ID }),
        "en",
      ),
    ).toBe("24 hours — every day of the week");
  });

  it("returns 24/7 line when twentyFourSeven is set", () => {
    expect(
      getOfficeWorkingHoursTableLabel(
        baseOffice({ workingHours: { twentyFourSeven: true } }),
        "en",
      ),
    ).toBe("24 hours — every day of the week");
  });

  it("formats custom from/to for ar and en", () => {
    const office = baseOffice({
      workingHours: { from: "09:00", to: "16:00" },
    });
    const ar = getOfficeWorkingHoursTableLabel(office, "ar");
    const en = getOfficeWorkingHoursTableLabel(office, "en");
    expect(ar).toContain("٩");
    expect(ar).toContain("٤");
    expect(en).toMatch(/9:00.*4:00/i);
  });

  it("uses custom exceptAr only for Arabic locale", () => {
    const office = baseOffice({
      workingHours: { from: "08:00", to: "17:00", exceptAr: "الجمعة فقط" },
    });
    expect(getOfficeWorkingHoursTableLabel(office, "ar")).toContain(
      "الجمعة فقط",
    );
    expect(getOfficeWorkingHoursTableLabel(office, "en")).toContain(
      "Fridays and official holidays",
    );
    expect(getOfficeWorkingHoursTableLabel(office, "en")).not.toContain(
      "الجمعة",
    );
  });
});

describe("getOfficeWorkingHoursAdminPreview", () => {
  it("matches Arabic table label", () => {
    const office = baseOffice();
    expect(getOfficeWorkingHoursAdminPreview(office)).toBe(
      getOfficeWorkingHoursTableLabel(office, "ar"),
    );
  });
});

describe("parseOfficeWorkingHoursFromForm", () => {
  it("returns twentyFourSeven when checked", () => {
    expect(
      parseOfficeWorkingHoursFromForm({
        twentyFourSeven: true,
        from: "08:00",
        to: "17:00",
        exceptAr: "",
      }),
    ).toEqual({ twentyFourSeven: true });
  });

  it("rejects invalid time range", () => {
    expect(() =>
      parseOfficeWorkingHoursFromForm({
        twentyFourSeven: false,
        from: "17:00",
        to: "08:00",
        exceptAr: "",
      }),
    ).toThrow();
  });
});
