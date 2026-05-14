import { timingSafeEqual } from "node:crypto";

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
