import { timingSafeEqual } from "node:crypto";

export const BOOKING_PASS_TOKEN_TTL_DAYS = 30;

/** Constant-time comparison for pass tokens stored on the request document. */
export function passTokensMatch(stored: string, provided: string): boolean {
  if (!stored || !provided) return false;
  try {
    const a = Buffer.from(stored, "utf8");
    const b = Buffer.from(provided, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function bookingPassTokenExpiresAt(createdAt: Date): Date {
  return new Date(
    createdAt.getTime() + BOOKING_PASS_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
}

export function isBookingPassTokenExpired(
  expiresAt: Date | null,
  now = new Date(),
): boolean {
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) return true;
  return expiresAt.getTime() <= now.getTime();
}
