export type LogEventName =
  | "booking.created"
  | "booking.rejected.capacity"
  | "booking.rejected.duplicate"
  | "checkin.created"
  | "queue.completed"
  | "admin.update.failed";

export function logEvent(
  name: LogEventName,
  fields?: Record<string, string | number | boolean | null | undefined>,
): void {
  const payload = {
    event: name,
    ts: new Date().toISOString(),
    ...fields,
  };
  console.info(JSON.stringify(payload));
}
