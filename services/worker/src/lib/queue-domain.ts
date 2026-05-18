const CAIRO_TZ = "Africa/Cairo";

export const AHEAD_NOTIFY_AT = 5;

export function getCairoTodayYmd(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function dailyStatsId(date: string, officeId: string): string {
  return `${date}_${officeId}`;
}

export function queueNotifyFiveAhead(): { title: string; body: string } {
  return {
    title: "اقترب دورك",
    body: `باقي ${AHEAD_NOTIFY_AT} على الدور — استعد للتوجه إلى المكتب.`,
  };
}

export function queueNotifyYourTurn(): { title: string; body: string } {
  return {
    title: "دورك الآن",
    body: "توجّه إلى شباك المكتب الآن.",
  };
}
