import { describe, expect, it } from "vitest";
import {
  bookingDuplicateDocId,
  buildBookingDuplicateKeyMaterial,
} from "@/lib/office-requests/booking-duplicate-key";

describe("bookingDuplicateDocId", () => {
  const base = {
    officeId: "cairo-trav-1",
    preferredDate: "2026-06-01",
    travelerStateId: "hajj",
    name: "أحمد   محمد",
    phone: "01552900017",
  };

  it("normalizes phone and name in key material", () => {
    const a = buildBookingDuplicateKeyMaterial(base);
    const b = buildBookingDuplicateKeyMaterial({
      ...base,
      name: "أحمد محمد",
      phone: "+20 155 290 0017",
    });
    expect(a).toBe(b);
  });

  it("produces stable doc ids", () => {
    expect(bookingDuplicateDocId(base)).toBe(bookingDuplicateDocId(base));
  });

  it("differs when office or date changes", () => {
    expect(bookingDuplicateDocId(base)).not.toBe(
      bookingDuplicateDocId({ ...base, preferredDate: "2026-06-02" }),
    );
  });
});
