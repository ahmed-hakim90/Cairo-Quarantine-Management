"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QueueTicket } from "@/lib/queue/types";
import type { QueuePositionPublic } from "@/lib/queue/types";
import { AHEAD_NOTIFY_AT } from "@/lib/queue/queue-logic";
import {
  isQueueNotifySupported,
  obtainQueueFcmToken,
  registerQueueWatchOnServer,
} from "@/lib/firebase/messaging-client";
import { saveQueueTicketId } from "@/lib/queue/queue-wait-storage";
import {
  shouldVibrateForAhead,
  shouldVibrateForTurn,
  vibrateQueueAlert,
} from "@/lib/queue/queue-vibrate";

const POLL_MS = 20_000;

type QueueWaitLiveProps = {
  ticket: QueueTicket;
  officeNameAr: string;
  citizenName?: string;
};

export function QueueWaitLive({
  ticket,
  officeNameAr,
  citizenName,
}: QueueWaitLiveProps) {
  const [position, setPosition] = useState<QueuePositionPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifyState, setNotifyState] = useState<
    "idle" | "pending" | "enabled" | "denied" | "unsupported"
  >("idle");
  const [notifyError, setNotifyError] = useState<string | null>(null);

  const prevAheadRef = useRef<number | null>(null);
  const vibratedFiveRef = useRef(false);
  const vibratedTurnRef = useRef(false);

  const fetchPosition = useCallback(async () => {
    const res = await fetch(
      `/api/queue/position?ticketId=${encodeURIComponent(ticket.id)}`,
    );
    if (!res.ok) return null;
    return (await res.json()) as QueuePositionPublic;
  }, [ticket.id]);

  const applyPosition = useCallback((next: QueuePositionPublic) => {
    const prev = prevAheadRef.current;
    if (
      shouldVibrateForAhead(next.aheadCount, prev, vibratedFiveRef.current)
    ) {
      vibrateQueueAlert("five_ahead");
      showLocalNotification(
        "اقترب دورك",
        "أمامك 5 أشخاص — استعد للتوجه إلى المكتب.",
      );
      vibratedFiveRef.current = true;
    }
    if (
      shouldVibrateForTurn(
        next.aheadCount,
        next.status,
        vibratedTurnRef.current,
      )
    ) {
      vibrateQueueAlert("your_turn");
      showLocalNotification("دورك الآن", "توجّه إلى شباك المكتب الآن.");
      vibratedTurnRef.current = true;
    }
    prevAheadRef.current = next.aheadCount;
    setPosition(next);
  }, []);

  useEffect(() => {
    saveQueueTicketId(ticket.id);
  }, [ticket.id]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const next = await fetchPosition();
      if (cancelled || !next) return;
      applyPosition(next);
      setLoading(false);
    }

    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [applyPosition, fetchPosition]);

  async function enableNotifications() {
    if (!isQueueNotifySupported()) {
      setNotifyState("unsupported");
      return;
    }
    setNotifyState("pending");
    setNotifyError(null);
    try {
      const token = await obtainQueueFcmToken();
      if (!token) {
        setNotifyState("denied");
        setNotifyError(
          "لم يُفعَّل الإشعار. على iPhone ثبّت الموقع كتطبيق (PWA) ثم اسمح بالإشعارات من الإعدادات.",
        );
        return;
      }
      const ok = await registerQueueWatchOnServer({
        ticketId: ticket.id,
        fcmToken: token,
      });
      if (!ok) {
        setNotifyState("denied");
        setNotifyError("تعذر تسجيل التنبيه على الخادم.");
        return;
      }
      setNotifyState("enabled");
    } catch (e) {
      setNotifyState("denied");
      setNotifyError(e instanceof Error ? e.message : "تعذر تفعيل التنبيهات.");
    }
  }

  useEffect(() => {
    if (!isQueueNotifySupported()) {
      setNotifyState("unsupported");
      return;
    }
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      void enableNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount when already granted
  }, []);

  const aheadCount = position?.aheadCount ?? null;
  const showAhead =
    position &&
    position.status === "waiting" &&
    !position.queueClosed &&
    aheadCount !== null &&
    aheadCount > 0;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="rounded-xl border border-gov-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-gov-gray-600">
          رقم الدور
        </p>
        <p className="mt-2 font-heading text-6xl font-extrabold text-gov-accent">
          {ticket.queueNumber}
        </p>

        {showAhead ? (
          <p className="mt-4 text-2xl font-extrabold text-gov-navy">
            أمامك{" "}
            <span className="text-gov-accent">{aheadCount}</span>{" "}
            {aheadCount === 1 ? "شخص" : "أشخاص"}
          </p>
        ) : null}

        {position?.status === "waiting" &&
        aheadCount === 0 &&
        !position.queueClosed ? (
          <p className="mt-4 text-xl font-extrabold text-emerald-800">
            دورك الآن — توجه إلى الشباك
          </p>
        ) : null}

        {loading ? (
          <p className="mt-3 text-sm text-gov-gray-600">جاري تحديث الموضع…</p>
        ) : (
          <p className="mt-3 text-sm font-semibold text-gov-gray-700">
            {position?.message ?? "—"}
          </p>
        )}

        <dl className="mt-6 grid gap-2 text-sm text-start">
          {citizenName ? (
            <Row label="الاسم" value={citizenName} />
          ) : null}
          <Row label="رقم الطلب" value={ticket.requestNumber} />
          <Row label="المكتب" value={officeNameAr} />
          <Row label="تاريخ اليوم" value={ticket.queueDate} />
        </dl>
      </div>

      <div className="rounded-lg border border-gov-gray-200 bg-gov-gray-50/80 p-4 text-sm text-gov-gray-700">
        <p className="font-bold text-gov-navy">التنبيهات</p>
        <p className="mt-1 leading-relaxed">
          عند بقاء {AHEAD_NOTIFY_AT} أشخاص أمامك وعند دورك، يصل إشعار على
          الموبايل (يفضّل الإبقاء على الصفحة مفتوحة أو تثبيت الموقع). على
          iPhone يعمل الإشعار بعد التثبيت كتطبيق من الشاشة الرئيسية.
        </p>
        {notifyState === "enabled" ? (
          <p className="mt-2 font-semibold text-emerald-800">التنبيهات مفعّلة.</p>
        ) : notifyState === "unsupported" ? (
          <p className="mt-2 text-gov-gray-600">
            المتصفح لا يدعم الإشعارات — يمكنك متابعة «أمامك X» على هذه الشاشة.
          </p>
        ) : (
          <button
            type="button"
            disabled={notifyState === "pending"}
            onClick={() => void enableNotifications()}
            className="mt-3 w-full rounded-md bg-gov-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-gov-accent disabled:opacity-60"
          >
            {notifyState === "pending" ? "جاري التفعيل…" : "تفعيل التنبيهات"}
          </button>
        )}
        {notifyError ? (
          <p className="mt-2 text-xs font-semibold text-red-800">{notifyError}</p>
        ) : null}
      </div>
    </div>
  );
}

function showLocalNotification(title: string, body: string) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icons/icon-192.png", tag: "queue-alert" });
  } catch {
    /* ignore */
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-md border border-gov-gray-100 bg-white px-3 py-2">
      <dt className="text-gov-gray-600">{label}</dt>
      <dd className="font-bold text-gov-navy">{value}</dd>
    </div>
  );
}
