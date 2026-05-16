import type { OfficeRequestStatus } from "@/lib/office-requests/types";

export const DUPLICATE_BOOKING_MESSAGE =
  "هذا الطلب مسجّل مسبقاً. راجع صفحة طلباتي لمتابعة حجزك.";

export type BookingDuplicateLookupInput = {
  officeId: string;
  preferredDate: string;
  travelerStateId: string;
  name: string;
  phone: string;
};

export type BookingDuplicateDoc = {
  status: OfficeRequestStatus;
  travelerStateId?: string;
  name: string;
};

export function normalizeBookingNameForCompare(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function isDuplicateBookingCandidate(
  doc: BookingDuplicateDoc,
  input: BookingDuplicateLookupInput,
): boolean {
  if (doc.status === "cancelled") return false;
  const docStateId = doc.travelerStateId?.trim();
  const inputStateId = input.travelerStateId.trim();
  if (!docStateId || docStateId !== inputStateId) return false;
  return (
    normalizeBookingNameForCompare(doc.name) ===
    normalizeBookingNameForCompare(input.name)
  );
}

export function findMatchingDuplicateBooking(
  docs: BookingDuplicateDoc[],
  input: BookingDuplicateLookupInput,
): BookingDuplicateDoc | null {
  for (const doc of docs) {
    if (isDuplicateBookingCandidate(doc, input)) return doc;
  }
  return null;
}
