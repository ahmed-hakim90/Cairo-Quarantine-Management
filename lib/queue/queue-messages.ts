import type { QueueTicketStatus } from "@/lib/queue/types";
import { AHEAD_NOTIFY_AT } from "@/lib/queue/queue-logic";

export type QueueNotifyCopy = {
  title: string;
  body: string;
};

/** Large headline on the wait screen when others are still ahead. */
export function queueAheadHeadline(aheadCount: number): string | null {
  if (aheadCount <= 0) return null;
  if (aheadCount === 1) return "باقي شخص واحد على الدور";
  return `باقي ${aheadCount} على الدور`;
}

/** Secondary line under the headline (omitted when alone). */
export function queueAheadDetail(aheadCount: number): string | null {
  if (aheadCount <= 1) return null;
  return `أمامك ${aheadCount} أشخاص في الانتظار`;
}

export function queueYourTurnHeadline(): string {
  return "دورك الآن";
}

export function queueYourTurnSubline(): string {
  return "توجّه إلى شباك المكتب";
}

export function queuePositionLoadingMessage(): string {
  return "جاري حساب موقعك في الطابور…";
}

/** API / status line for queue position responses. */
export function queuePositionMessage(
  status: QueueTicketStatus,
  aheadCount: number,
  queueClosed: boolean,
): string {
  if (queueClosed) return "تم إغلاق طابور اليوم لهذا المكتب.";
  if (status === "completed") return "تم الانتهاء من المكتب.";
  if (aheadCount === 0) return queueYourTurnSubline();
  return queueAheadDetail(aheadCount) ?? queueAheadHeadline(aheadCount) ?? "—";
}

export function queueNotifyFiveAhead(): QueueNotifyCopy {
  return {
    title: "اقترب دورك",
    body: `باقي ${AHEAD_NOTIFY_AT} على الدور — استعد للتوجه إلى المكتب.`,
  };
}

export function queueNotifyYourTurn(): QueueNotifyCopy {
  return {
    title: queueYourTurnHeadline(),
    body: `${queueYourTurnSubline()} الآن.`,
  };
}

export function queueAlertsHelpText(
  aheadNotifyAt: number = AHEAD_NOTIFY_AT,
): string {
  return `عندما يبقى ${aheadNotifyAt} على الدور وعند دورك، يصل إشعار على الموبايل (يفضّل الإبقاء على الصفحة مفتوحة أو تثبيت الموقع). على iPhone يعمل الإشعار بعد التثبيت كتطبيق من الشاشة الرئيسية.`;
}

export function queueAlertsUnsupportedHint(): string {
  return "المتصفح لا يدعم الإشعارات — يمكنك متابعة «باقي X على الدور» على هذه الشاشة.";
}
