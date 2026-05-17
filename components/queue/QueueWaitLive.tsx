"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PwaInstallCard } from "@/components/pwa/PwaInstallCard";
import type { Locale } from "@/lib/i18n/config";
import { queueCitizenCopy } from "@/lib/i18n/queue-citizen-copy";
import type { QueuePositionPublic, QueueTicket } from "@/lib/queue/types";
import {
  queueNotifyFiveAhead,
  queueNotifyYourTurn,
} from "@/lib/queue/queue-messages";
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
  locale: Locale;
  ticket: QueueTicket;
  officeNameAr: string;
  citizenName?: string;
  iosHelp: string;
};

function formatAheadLine(locale: Locale, aheadCount: number): string {
  const copy = queueCitizenCopy[locale];
  if (aheadCount <= 0) return copy.yourTurnNow;
  if (aheadCount === 1) return copy.aheadYouOne;
  return copy.aheadYouMany.replace("{count}", String(aheadCount));
}

export function QueueWaitLive({
  locale,
  ticket,
  officeNameAr,
  citizenName,
  iosHelp,
}: QueueWaitLiveProps) {
  const t = queueCitizenCopy[locale];
  const [position, setPosition] = useState<QueuePositionPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [positionError, setPositionError] = useState(false);
  const [notifyState, setNotifyState] = useState<
    "idle" | "pending" | "enabled" | "denied" | "unsupported"
  >(() =>
    typeof window !== "undefined" && !isQueueNotifySupported()
      ? "unsupported"
      : "idle",
  );
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
      const fiveAhead = queueNotifyFiveAhead();
      showLocalNotification(fiveAhead.title, fiveAhead.body);
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
      const yourTurn = queueNotifyYourTurn();
      showLocalNotification(yourTurn.title, yourTurn.body);
      vibratedTurnRef.current = true;
    }
    prevAheadRef.current = next.aheadCount;
    setPosition(next);
    setPositionError(false);
  }, []);

  const pollPosition = useCallback(async () => {
    const next = await fetchPosition();
    if (!next) {
      setPositionError(true);
      setLoading(false);
      return;
    }
    applyPosition(next);
    setLoading(false);
  }, [applyPosition, fetchPosition]);

  useEffect(() => {
    saveQueueTicketId(ticket.id);
  }, [ticket.id]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      await pollPosition();
    }

    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pollPosition]);

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
        setNotifyError(t.notifyDenied);
        return;
      }
      const ok = await registerQueueWatchOnServer({
        ticketId: ticket.id,
        fcmToken: token,
      });
      if (!ok) {
        setNotifyState("denied");
        setNotifyError(t.notifyServerError);
        return;
      }
      setNotifyState("enabled");
    } catch (e) {
      setNotifyState("denied");
      setNotifyError(
        e instanceof Error ? e.message : t.notifyServerError,
      );
    }
  }

  useEffect(() => {
    if (notifyState === "unsupported") return;
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const id = window.setTimeout(() => {
        void enableNotifications();
      }, 0);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount when already granted
  }, []);

  const aheadCount = position?.aheadCount ?? null;
  const waitingInLine =
    position?.status === "waiting" && !position?.queueClosed;
  const showAheadBlock =
    !loading && !positionError && waitingInLine && aheadCount !== null;
  const showTurnNow = showAheadBlock && aheadCount === 0;
  const showAheadCount = showAheadBlock && aheadCount !== null && aheadCount > 0;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <PwaInstallCard
        variant="queue"
        title={t.installAppTitle}
        body={t.installAppBody}
        installButton={t.installAppButton}
        ariaLabel={t.installAppAria}
        iosHelp={iosHelp}
      />
      <div className="rounded-xl border border-gov-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gov-gray-600">
            {t.queueNumberHeading}
          </p>
          <p className="mt-2 font-heading text-6xl font-extrabold text-gov-accent">
            {ticket.queueNumber}
          </p>

          <div className="mt-5 border-t border-gov-gray-100 pt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-gov-gray-600">
                {t.aheadInQueue}
              </p>

              {loading ? (
                <p className="mt-3 text-sm font-semibold text-gov-gray-600">
                  {t.updatingPosition}
                </p>
              ) : positionError ? (
                <p className="mt-3 text-sm font-semibold text-red-800">
                  {t.positionError}
                </p>
              ) : showTurnNow ? (
                <p className="mt-3 text-2xl font-extrabold text-emerald-800">
                  {t.yourTurnNow}
                </p>
              ) : showAheadCount && aheadCount !== null ? (
                <p className="mt-3 text-2xl font-extrabold leading-snug text-gov-navy">
                  {formatAheadLine(locale, aheadCount)}
                </p>
              ) : position?.message ? (
                <p className="mt-3 text-sm font-semibold text-gov-gray-700">
                  {position.message}
                </p>
              ) : null}
          </div>

          <dl className="mt-6 grid gap-2 text-sm text-start">
            {citizenName ? (
              <Row label={t.nameLabel} value={citizenName} />
            ) : null}
            <Row label={t.requestNumberLabel} value={ticket.requestNumber} />
            <Row label={t.officeLabel} value={officeNameAr} />
            <Row label={t.queueDateLabel} value={ticket.queueDate} />
          </dl>
      </div>

      <div className="rounded-lg border border-gov-gray-200 bg-gov-gray-50/80 p-4 text-sm text-gov-gray-700">
        <p className="font-bold text-gov-navy">{t.notifyTitle}</p>
        <p className="mt-1 leading-relaxed">{t.notifyBody}</p>
        {notifyState === "enabled" ? (
          <p className="mt-2 font-semibold text-emerald-800">{t.notifyEnabled}</p>
        ) : notifyState === "unsupported" ? (
          <p className="mt-2 text-gov-gray-600">{t.notifyUnsupported}</p>
        ) : (
          <button
            type="button"
            disabled={notifyState === "pending"}
            onClick={() => void enableNotifications()}
            className="mt-3 w-full rounded-md bg-gov-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-gov-accent disabled:opacity-60"
          >
            {notifyState === "pending" ? t.notifyEnabling : t.notifyEnable}
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
