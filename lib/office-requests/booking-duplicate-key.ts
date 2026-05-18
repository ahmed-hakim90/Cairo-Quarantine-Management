import { createHash } from "node:crypto";
import { normalizeBookingNameForCompare } from "@/lib/office-requests/booking-duplicate";
import { normalizePhoneForStorage } from "@/lib/office-requests/whatsapp-message";

export type BookingDuplicateKeyInput = {
  officeId: string;
  preferredDate: string;
  travelerStateId: string;
  name: string;
  phone: string;
};

/** Canonical string hashed into `booking_duplicates` document id. */
export function buildBookingDuplicateKeyMaterial(
  input: BookingDuplicateKeyInput,
): string {
  return [
    input.officeId.trim(),
    input.preferredDate.trim(),
    input.travelerStateId.trim(),
    normalizePhoneForStorage(input.phone),
    normalizeBookingNameForCompare(input.name),
  ].join("|");
}

export function bookingDuplicateDocId(input: BookingDuplicateKeyInput): string {
  return createHash("sha256")
    .update(buildBookingDuplicateKeyMaterial(input))
    .digest("base64url");
}

export function canBuildBookingDuplicateKey(
  input: BookingDuplicateKeyInput & { type?: string },
): boolean {
  return (
    (input.type === undefined || input.type === "booking") &&
    Boolean(input.preferredDate?.trim()) &&
    Boolean(input.travelerStateId?.trim()) &&
    Boolean(input.officeId?.trim()) &&
    Boolean(input.name?.trim()) &&
    Boolean(input.phone?.trim())
  );
}
