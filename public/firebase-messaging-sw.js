/* eslint-disable no-undef */
// FCM background handler — loads public Firebase config from the app API.

importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js",
);

let messagingInitialized = false;

async function ensureMessaging() {
  if (messagingInitialized) return;
  const res = await fetch("/api/firebase/public-config");
  if (!res.ok) return;
  const config = await res.json();
  if (!config.apiKey) return;
  firebase.initializeApp(config);
  messagingInitialized = true;
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

ensureMessaging().then(() => {
  if (!messagingInitialized) return;
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title =
      payload.notification?.title || payload.data?.title || "تنبيه الطابور";
    const body =
      payload.notification?.body ||
      payload.data?.body ||
      "تحديث على دورك في المكتب";
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "queue-alert",
      renotify: true,
    });
  });
});
