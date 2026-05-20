import { describe, expect, it } from "vitest";
import {
  CAIRO_AIRPORT_VACCINATION_OFFICE_ID,
  getOfficeWorkingHoursTableLabel,
} from "@/lib/office-working-hours";

describe("getOfficeWorkingHoursTableLabel", () => {
  it("returns standard hours for regular offices", () => {
    expect(getOfficeWorkingHoursTableLabel("cairo-trav-2", "ar")).toBe(
      "٨ صباحًا – ٥ مساءً ( ما عدا الجُمع والعطلات الرسمية)",
    );
  });

  it("returns 24/7 line for Cairo airport office", () => {
    expect(
      getOfficeWorkingHoursTableLabel(
        CAIRO_AIRPORT_VACCINATION_OFFICE_ID,
        "en",
      ),
    ).toBe("24 hours — every day of the week");
  });
});
