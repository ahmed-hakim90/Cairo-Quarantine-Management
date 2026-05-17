"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { getFirebaseClientApp, isFirebaseClientConfigured } from "@/lib/firebase/client";

export function isQueueNotifySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export async function requestQueueNotificationPermission(): Promise<NotificationPermission> {
  if (!isQueueNotifySupported()) return "denied";
  return Notification.requestPermission();
}

export async function registerQueueMessagingSw(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

export async function obtainQueueFcmToken(): Promise<string | null> {
  if (!isFirebaseClientConfigured()) return null;
  if (!(await isSupported())) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) return null;

  const permission = await requestQueueNotificationPermission();
  if (permission !== "granted") return null;

  const registration = await registerQueueMessagingSw();
  if (!registration) return null;

  const messaging = getMessaging(getFirebaseClientApp());
  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
}

export async function registerQueueWatchOnServer(args: {
  ticketId: string;
  fcmToken: string;
}): Promise<boolean> {
  const res = await fetch("/api/queue/watch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  return res.ok;
}
