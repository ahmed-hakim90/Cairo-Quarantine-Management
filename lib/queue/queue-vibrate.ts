import { AHEAD_NOTIFY_AT } from "@/lib/queue/queue-logic";

export function vibrateQueueAlert(kind: "five_ahead" | "your_turn") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  if (document.visibilityState === "hidden") return;
  if (kind === "five_ahead") {
    navigator.vibrate([180, 80, 180]);
  } else {
    navigator.vibrate([250, 100, 250, 100, 350]);
  }
}

export function shouldVibrateForAhead(
  aheadCount: number,
  prevAhead: number | null,
  alreadyVibratedFive: boolean,
): boolean {
  return (
    aheadCount === AHEAD_NOTIFY_AT &&
    prevAhead !== AHEAD_NOTIFY_AT &&
    !alreadyVibratedFive
  );
}

export function shouldVibrateForTurn(
  aheadCount: number,
  status: string,
  alreadyVibratedTurn: boolean,
): boolean {
  return aheadCount === 0 && status === "waiting" && !alreadyVibratedTurn;
}
