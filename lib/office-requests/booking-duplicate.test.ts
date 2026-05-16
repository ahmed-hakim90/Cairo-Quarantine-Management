import { describe, expect, it } from "vitest";
import {
  findMatchingDuplicateBooking,
  isDuplicateBookingCandidate,
  normalizeBookingNameForCompare,
  type BookingDuplicateDoc,
  type BookingDuplicateLookupInput,
} from "@/lib/office-requests/booking-duplicate";

const baseInput: BookingDuplicateLookupInput = {
  officeId: "office-a",
  preferredDate: "2026-05-20",
  travelerStateId: "international",
  name: "أحمد  محمد",
  phone: "+20 100 123 4567",
};

function doc(
  overrides: Partial<BookingDuplicateDoc> = {},
): BookingDuplicateDoc {
  return {
    status: "new",
    travelerStateId: "international",
    name: "أحمد محمد",
    ...overrides,
  };
}

describe("normalizeBookingNameForCompare", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeBookingNameForCompare("  أحمد   محمد  ")).toBe(
      "أحمد محمد",
    );
  });
});

describe("isDuplicateBookingCandidate", () => {
  it("matches when name differs only by spacing", () => {
    expect(isDuplicateBookingCandidate(doc(), baseInput)).toBe(true);
  });

  it("ignores cancelled requests", () => {
    expect(
      isDuplicateBookingCandidate(doc({ status: "cancelled" }), baseInput),
    ).toBe(false);
  });

  it("rejects different traveler state", () => {
    expect(
      isDuplicateBookingCandidate(
        doc({ travelerStateId: "hajj_umrah" }),
        baseInput,
      ),
    ).toBe(false);
  });

  it("rejects different name", () => {
    expect(
      isDuplicateBookingCandidate(doc({ name: "محمد علي" }), baseInput),
    ).toBe(false);
  });
});

describe("findMatchingDuplicateBooking", () => {
  it("returns first non-cancelled duplicate", () => {
    const match = findMatchingDuplicateBooking(
      [
        doc({ status: "cancelled", name: "أحمد محمد" }),
        doc({ status: "new", name: "أحمد محمد" }),
      ],
      baseInput,
    );
    expect(match?.status).toBe("new");
  });

  it("returns null when only cancelled matches exist", () => {
    expect(
      findMatchingDuplicateBooking(
        [doc({ status: "cancelled" })],
        baseInput,
      ),
    ).toBeNull();
  });

  it("matches on pre-filtered candidates regardless of input officeId", () => {
    expect(
      findMatchingDuplicateBooking([doc()], {
        ...baseInput,
        officeId: "office-b",
      }),
    ).not.toBeNull();
  });
});
