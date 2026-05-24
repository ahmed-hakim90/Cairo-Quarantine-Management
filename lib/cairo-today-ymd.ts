import { DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR } from "@/lib/office-requests/types";

const CAIRO_TZ = "Africa/Cairo";

export type CairoMinBookingOptions = {
  /** Hour (0–23) in Cairo after which same-day booking is closed. Defaults from app settings constant. */
  sameDayCutoffHour?: number;
};

function resolvedCutoffHour(sameDayCutoffHour?: number): number {
  const h =
    typeof sameDayCutoffHour === "number" &&
    Number.isFinite(sameDayCutoffHour)
      ? Math.floor(sameDayCutoffHour)
      : DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR;
  return Math.min(23, Math.max(0, h));
}

/**
 * Today's calendar date in Cairo (YYYY-MM-DD), comparable lexicographically with
 * `<input type="date">` values.
 */
export function getCairoTodayYmd(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Calendar day `days` before today in Cairo (YYYY-MM-DD). */
export function getCairoYmdDaysAgo(days: number, ref = new Date()): string {
  const today = getCairoTodayYmd(ref);
  const noonCairo = new Date(`${today}T12:00:00+02:00`);
  const ms = Math.max(0, Math.floor(days)) * 24 * 60 * 60 * 1000;
  return getCairoTodayYmd(new Date(noonCairo.getTime() - ms));
}

/** Calendar day before `getCairoTodayYmd(ref)` in Cairo (YYYY-MM-DD). */
export function getCairoYesterdayYmd(ref = new Date()): string {
  const today = getCairoTodayYmd(ref);
  const noonCairo = new Date(`${today}T12:00:00+02:00`);
  return getCairoTodayYmd(new Date(noonCairo.getTime() - 24 * 60 * 60 * 1000));
}

/** Calendar day after `getCairoTodayYmd(ref)` in Cairo (YYYY-MM-DD). */
export function getCairoTomorrowYmd(ref = new Date()): string {
  return getCairoYmdDaysAfter(1, getCairoTodayYmd(ref));
}

/** Calendar day `days` after `fromYmd` in Cairo (YYYY-MM-DD). */
export function getCairoYmdDaysAfter(days: number, fromYmd: string): string {
  const noonCairo = new Date(`${fromYmd}T12:00:00+02:00`);
  const ms = Math.max(0, Math.floor(days)) * 24 * 60 * 60 * 1000;
  return getCairoTodayYmd(new Date(noonCairo.getTime() + ms));
}

/** Inclusive Cairo calendar days from `fromYmd` through `toYmd` (YYYY-MM-DD). */
export function enumerateCairoYmdRange(fromYmd: string, toYmd: string): string[] {
  if (fromYmd > toYmd) return [];
  const out: string[] = [];
  let current = fromYmd;
  for (let i = 0; i < 400; i++) {
    out.push(current);
    if (current === toYmd) break;
    current = getCairoYmdDaysAfter(1, current);
  }
  return out;
}

function getCairoHour24(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CAIRO_TZ,
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value;
  return hour != null ? Number.parseInt(hour, 10) : 0;
}

/** First Cairo calendar day strictly after `ymd`, searching forward from `from`. */
function firstCairoYmdAfter(ymd: string, from: Date): string {
  let t = from.getTime();
  for (let i = 0; i < 60; i++) {
    t += 3600000;
    const candidate = getCairoTodayYmd(new Date(t));
    if (candidate > ymd) return candidate;
  }
  return getCairoTodayYmd(new Date(from.getTime() + 48 * 3600000));
}

/**
 * Earliest bookable calendar date in Cairo: today before `sameDayCutoffHour`, otherwise tomorrow.
 */
export function getCairoMinBookingYmd(
  from = new Date(),
  options?: CairoMinBookingOptions,
): string {
  const cutoff = resolvedCutoffHour(options?.sameDayCutoffHour);
  const today = getCairoTodayYmd(from);
  if (getCairoHour24(from) >= cutoff) {
    return firstCairoYmdAfter(today, from);
  }
  return today;
}
