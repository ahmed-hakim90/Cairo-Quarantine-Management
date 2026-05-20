"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizedNavPath } from "@/components/layout/SiteNavLinks";
import { collection, onSnapshot, query, where, type Query, type Unsubscribe } from "firebase/firestore";
import {
  getFirestoreListenerErrorMessage,
  isFirestorePermissionDenied,
} from "@/lib/firebase/firestore-listener-error";
import {
  isNewRequestSoundMuted,
  playNewRequestSound,
  playNewRequestSoundTest,
  setNewRequestSoundMuted,
  unlockNewRequestSound,
} from "@/lib/admin/new-request-sound";
import { ensureAdminFirebaseAuth } from "@/lib/firebase/admin-client-auth";
import {
  getFirebaseFirestore,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";
import {
  buildNotifyOfficeIdBatches,
  notifyScopeFromProfile,
  REQUESTS_COLLECTION,
  requestFromFirestoreSnapshot,
  shouldNotifyRequest,
  type NotifyRequestPayload,
  type NotifyScope,
} from "@/lib/office-requests/new-request-notify";
import { REQUEST_TYPE_LABELS, type AdminRole } from "@/lib/office-requests/types";

const MAX_NOTIFICATIONS = 30;

type NotificationItem = {
  id: string;
  request: NotifyRequestPayload;
  read: boolean;
};

type ListenerStatus = "idle" | "connecting" | "live" | "error";

type AdminNewRequestNotifierProps = {
  locale: string;
  role: AdminRole;
  officeId: string | null;
  allowedOfficeIds: string[];
};

function buildNewRequestQueries(
  db: ReturnType<typeof getFirebaseFirestore>,
  scope: NotifyScope,
): Query[] {
  const base = collection(db, REQUESTS_COLLECTION);
  const batches = buildNotifyOfficeIdBatches(scope);

  if (scope.role === "super_admin") {
    return [query(base, where("status", "==", "new"))];
  }

  return batches.map((officeIds) =>
    query(
      base,
      where("officeId", "in", officeIds),
      where("status", "==", "new"),
    ),
  );
}

function NotificationRow({
  item,
  locale,
  onDismiss,
}: {
  item: NotificationItem;
  locale: string;
  onDismiss: () => void;
}) {
  const { request } = item;
  const typeLabel = REQUEST_TYPE_LABELS[request.type] ?? request.type;
  const href =
    request.type === "booking"
      ? `/${locale}/admin/requests`
      : `/${locale}/admin/requests/${request.id}`;

  return (
    <div
      className={`border-b border-gov-gray-100 px-4 py-3 last:border-b-0 ${
        item.read ? "bg-white" : "bg-gov-accent/5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-gov-navy">طلب جديد</p>
          <p className="mt-0.5 text-xs text-gov-gray-600">
            {request.officeNameAr} — {typeLabel}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-gov-navy">
            {request.name}
          </p>
          <Link
            href={href}
            className="mt-2 inline-flex text-xs font-bold text-gov-accent underline decoration-gov-accent/40 underline-offset-2 hover:decoration-gov-accent"
            onClick={onDismiss}
          >
            {request.type === "booking" ? "عرض الحجوزات" : "عرض الطلب"}
          </Link>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-1 text-gov-gray-500 hover:bg-gov-gray-100 hover:text-gov-navy"
          aria-label="إزالة الإشعار"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function AdminNewRequestNotifier({
  locale,
  role,
  officeId,
  allowedOfficeIds,
}: AdminNewRequestNotifierProps) {
  const scope = useMemo(
    () =>
      notifyScopeFromProfile({
        role,
        officeId,
        allowedOfficeIds,
      }),
    [role, officeId, allowedOfficeIds],
  );

  const router = useRouter();
  const pathname = usePathname();
  const scopeRef = useRef(scope);
  const panelOpenRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scopeRef.current = scope;
  }, [scope]);

  const baselineIdsRef = useRef(new Set<string>());
  const baselineSeededRef = useRef(false);
  const listenersReadyRef = useRef(0);
  const listenersCountRef = useRef(0);
  const notifiedIdsRef = useRef(new Set<string>());
  const unsubscribesRef = useRef<Unsubscribe[]>([]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [muted, setMuted] = useState(() =>
    typeof window === "undefined" ? false : isNewRequestSoundMuted(),
  );
  const [authFailed, setAuthFailed] = useState(false);
  const [listenerStatus, setListenerStatus] =
    useState<ListenerStatus>("idle");
  const [listenerError, setListenerError] = useState<string | null>(null);

  useEffect(() => {
    panelOpenRef.current = panelOpen;
  }, [panelOpen]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const resetBaseline = useCallback(() => {
    baselineIdsRef.current = new Set();
    baselineSeededRef.current = false;
    listenersReadyRef.current = 0;
    listenersCountRef.current = 0;
    notifiedIdsRef.current = new Set();
  }, []);

  const scheduleRequestsListRefresh = useCallback(() => {
    if (normalizedNavPath(pathname) !== "/admin/requests") return;
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      router.refresh();
      refreshTimerRef.current = null;
    }, 400);
  }, [pathname, router]);

  const pushNotification = useCallback(
    (request: NotifyRequestPayload) => {
      const markRead = panelOpenRef.current;
      setNotifications((prev) => {
        const next = [
          { id: request.id, request, read: markRead },
          ...prev.filter((n) => n.id !== request.id),
        ];
        return next.slice(0, MAX_NOTIFICATIONS);
      });
      void playNewRequestSound();
      scheduleRequestsListRefresh();
    },
    [scheduleRequestsListRefresh],
  );

  const processAddedDoc = useCallback(
    (docId: string, data: Record<string, unknown>) => {
      const request = requestFromFirestoreSnapshot(docId, data);
      if (!shouldNotifyRequest(request, scopeRef.current)) return;

      if (baselineIdsRef.current.has(docId)) return;
      if (notifiedIdsRef.current.has(docId)) return;

      notifiedIdsRef.current.add(docId);
      pushNotification(request);
    },
    [pushNotification],
  );

  const teardownListeners = useCallback(() => {
    for (const unsub of unsubscribesRef.current) unsub();
    unsubscribesRef.current = [];
  }, []);

  const setupListeners = useCallback(async () => {
    teardownListeners();

    if (!isFirebaseClientConfigured()) {
      setListenerStatus("error");
      setListenerError(
        "إعدادات Firebase في المتصفح غير مكتملة (NEXT_PUBLIC_FIREBASE_*).",
      );
      return;
    }
    if (
      scope.role !== "super_admin" &&
      buildNotifyOfficeIdBatches(scope).length === 0
    ) {
      return;
    }

    const user = await ensureAdminFirebaseAuth();
    if (!user) {
      setAuthFailed(true);
      setListenerStatus("error");
      setListenerError("تعذّر تسجيل الدخول إلى Firebase");
      return;
    }
    setAuthFailed(false);

    const db = getFirebaseFirestore();
    const queries = buildNewRequestQueries(db, scope);

    if (!baselineSeededRef.current) {
      listenersReadyRef.current = 0;
      listenersCountRef.current = queries.length;
    }

    for (const firestoreQuery of queries) {
      const unsub = onSnapshot(
        firestoreQuery,
        (snapshot) => {
          setListenerStatus("live");
          setListenerError(null);

          if (!baselineSeededRef.current) {
            snapshot.docs.forEach((doc) => {
              baselineIdsRef.current.add(doc.id);
              notifiedIdsRef.current.add(doc.id);
            });
            listenersReadyRef.current += 1;
            if (listenersReadyRef.current >= listenersCountRef.current) {
              baselineSeededRef.current = true;
            }
            return;
          }

          snapshot.docChanges().forEach((change) => {
            if (change.type !== "added") return;
            processAddedDoc(change.doc.id, change.doc.data());
          });
        },
        (error) => {
          setListenerStatus("error");
          setListenerError(getFirestoreListenerErrorMessage(error));
          if (isFirestorePermissionDenied(error)) {
            setAuthFailed(true);
          }
          if (process.env.NODE_ENV === "development") {
            console.error("[AdminNewRequestNotifier] onSnapshot", error);
          }
        },
      );
      unsubscribesRef.current.push(unsub);
    }
  }, [processAddedDoc, scope, teardownListeners]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  useEffect(() => {
    resetBaseline();
  }, [scope, resetBaseline]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- subscription bootstrap
    void setupListeners();
    return () => teardownListeners();
  }, [setupListeners, teardownListeners]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        teardownListeners();
        setListenerStatus("idle");
      } else {
        void setupListeners();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [setupListeners, teardownListeners]);

  useEffect(() => {
    if (!panelOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPanelOpen(false);
    }
    function onPointerDown(e: MouseEvent) {
      const root = rootRef.current;
      if (root && !root.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [panelOpen]);

  function openPanel() {
    setPanelOpen(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function togglePanel() {
    if (panelOpen) {
      setPanelOpen(false);
    } else {
      openPanel();
    }
  }

  function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function clearAllNotifications() {
    setNotifications([]);
  }

  async function toggleMute() {
    const next = !muted;
    setMuted(next);
    setNewRequestSoundMuted(next);
    if (!next) {
      await unlockNewRequestSound();
      await playNewRequestSoundTest();
    }
  }

  const hasScope =
    scope.role === "super_admin" ||
    buildNotifyOfficeIdBatches(scope).length > 0;

  if (!hasScope) return null;

  const showListenerWarning =
    listenerStatus === "error" && listenerError && !authFailed;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={togglePanel}
        className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-gov-gray-200 bg-white text-gov-navy transition hover:border-gov-accent hover:text-gov-accent"
        aria-expanded={panelOpen}
        aria-haspopup="dialog"
        aria-label={
          unreadCount > 0
            ? `الإشعارات، ${unreadCount} غير مقروء`
            : "الإشعارات"
        }
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {panelOpen ? (
        <div
          role="dialog"
          aria-label="إشعارات الطلبات الجديدة"
          className="absolute top-full end-0 z-[100] mt-2 flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-lg border border-gov-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-gov-gray-200 px-4 py-3">
            <h2 className="text-sm font-extrabold text-gov-navy">الإشعارات</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void toggleMute()}
                className="rounded px-2 py-1 text-[11px] font-bold text-gov-gray-600 hover:bg-gov-gray-100"
                aria-pressed={muted}
              >
                {muted ? "تفعيل الصوت" : "كتم"}
              </button>
              {notifications.length > 0 ? (
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className="rounded px-2 py-1 text-[11px] font-bold text-gov-gray-600 hover:bg-gov-gray-100"
                >
                  مسح الكل
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-[min(70vh,24rem)] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gov-gray-500">
                لا توجد إشعارات جديدة
              </p>
            ) : (
              notifications.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  locale={locale}
                  onDismiss={() => dismissNotification(item.id)}
                />
              ))
            )}
          </div>

          {authFailed ? (
            <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900">
              تعذّر تفعيل الإشعار الفوري. أعد تحميل الصفحة أو سجّل الدخول من
              جديد.
            </p>
          ) : null}

          {showListenerWarning ? (
            <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900">
              {listenerError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
