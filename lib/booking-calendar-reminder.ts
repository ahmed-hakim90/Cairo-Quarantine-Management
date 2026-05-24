const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function ymdToIcsDate(ymd: string): string | null {
  if (!YMD_RE.test(ymd)) return null;
  return ymd.replace(/-/g, "");
}

export function icsAllDayEndDate(ymd: string): string | null {
  if (!YMD_RE.test(ymd)) return null;
  const [year, month, day] = ymd.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export type BookingReminderCalendarInput = {
  requestId: string;
  preferredDate: string;
  title: string;
  description: string;
};

export function buildBookingReminderIcs(
  input: BookingReminderCalendarInput,
): string | null {
  const start = ymdToIcsDate(input.preferredDate);
  const end = icsAllDayEndDate(input.preferredDate);
  if (!start || !end) return null;

  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cairo Quarantine//Booking Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:booking-${input.requestId}-${start}@cairo-quarantine`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
    `DESCRIPTION:${escapeIcsText(input.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function buildGoogleCalendarReminderUrl(
  input: BookingReminderCalendarInput,
): string | null {
  const start = ymdToIcsDate(input.preferredDate);
  const end = icsAllDayEndDate(input.preferredDate);
  if (!start || !end) return null;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${start}/${end}`,
    details: input.description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadBookingReminderIcs(
  input: BookingReminderCalendarInput,
): boolean {
  const ics = buildBookingReminderIcs(input);
  if (!ics || typeof document === "undefined") return false;

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `cairo-booking-${input.requestId}-${input.preferredDate}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}
