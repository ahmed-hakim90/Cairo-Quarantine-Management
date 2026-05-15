"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  type Query,
  type Unsubscribe,
} from "firebase/firestore";
import {
  isNewRequestSoundMuted,
  playNewRequestSound,
  setNewRequestSoundMuted,
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

const MAX_TOASTS = 3;

type ToastItem = {
  id: string;
  request: NotifyRequestPayload;
};

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

function RequestToast({
  toast,
  locale,
  onDismiss,
}: {
  toast: ToastItem;
  locale: string;
  onDismiss: () => void;
}) {
  const { request } = toast;
  const typeLabel = REQUEST_TYPE_LABELS[request.type] ?? request.type;

  return (
    <div
      role="status"
      className="w-[min(100vw-2rem,22rem)] rounded-lg border border-gov-accent/30 bg-white p-4 shadow-lg"
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 text-gov-gray-600 hover:bg-gov-gray-100 hover:text-gov-navy"
          aria-label="إغلاق الإشعار"
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
      <p className="mt-1 text-sm font-extrabold text-gov-navy">طلب جديد</p>
      <p className="mt-1 text-sm text-gov-gray-700">
        {request.officeNameAr} — {typeLabel}
      </p>
      <p className="text-sm font-semibold text-gov-navy">{request.name}</p>
      <Link
        href={`/${locale}/admin/requests/${request.id}`}
        className="mt-3 inline-flex text-sm font-bold text-gov-accent underline decoration-gov-accent/40 underline-offset-2 hover:decoration-gov-accent"
        onClick={onDismiss}
      >
        عرض الطلب
      </Link>
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

  const scopeRef = useRef(scope);
  scopeRef.current = scope;

  const notifiedIdsRef = useRef(new Set<string>());
  const unsubscribesRef = useRef<Unsubscribe[]>([]);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [muted, setMuted] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);

  const pushToast = useCallback((request: NotifyRequestPayload) => {
    setToasts((prev) => {
      const next = [
        { id: request.id, request },
        ...prev.filter((t) => t.id !== request.id),
      ];
      return next.slice(0, MAX_TOASTS);
    });
    playNewRequestSound();
  }, []);

  const processAddedDoc = useCallback(
    (docId: string, data: Record<string, unknown>, isInitial: boolean) => {
      const request = requestFromFirestoreSnapshot(docId, data);
      if (!shouldNotifyRequest(request, scopeRef.current)) return;

      if (isInitial) {
        notifiedIdsRef.current.add(docId);
        return;
      }

      if (notifiedIdsRef.current.has(docId)) return;
      notifiedIdsRef.current.add(docId);
      pushToast(request);
    },
    [pushToast],
  );

  const teardownListeners = useCallback(() => {
    for (const unsub of unsubscribesRef.current) unsub();
    unsubscribesRef.current = [];
  }, []);

  const setupListeners = useCallback(async () => {
    teardownListeners();

    if (!isFirebaseClientConfigured()) return;
    if (
      scope.role !== "super_admin" &&
      buildNotifyOfficeIdBatches(scope).length === 0
    ) {
      return;
    }

    const user = await ensureAdminFirebaseAuth();
    if (!user) {
      setAuthFailed(true);
      return;
    }
    setAuthFailed(false);

    const db = getFirebaseFirestore();
    const queries = buildNewRequestQueries(db, scope);

    for (const firestoreQuery of queries) {
      let isInitial = true;

      const unsub = onSnapshot(
        firestoreQuery,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type !== "added") return;
            processAddedDoc(change.doc.id, change.doc.data(), isInitial);
          });
          isInitial = false;
        },
        () => {
          setAuthFailed(true);
        },
      );
      unsubscribesRef.current.push(unsub);
    }
  }, [processAddedDoc, scope, teardownListeners]);

  useEffect(() => {
    setMuted(isNewRequestSoundMuted());
  }, []);

  useEffect(() => {
    void setupListeners();
    return () => teardownListeners();
  }, [setupListeners, teardownListeners]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        teardownListeners();
      } else {
        void setupListeners();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [setupListeners, teardownListeners]);

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setNewRequestSoundMuted(next);
  }

  const hasScope =
    scope.role === "super_admin" ||
    buildNotifyOfficeIdBatches(scope).length > 0;

  if (!hasScope) return null;

  return (
    <div className="fixed bottom-4 end-4 z-[90] flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={toggleMute}
        className="rounded-md border border-gov-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gov-navy shadow-sm hover:bg-gov-gray-50"
        aria-pressed={muted}
      >
        {muted ? "تفعيل صوت الإشعار" : "كتم صوت الإشعار"}
      </button>

      {authFailed ? (
        <p className="max-w-xs rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 shadow-sm">
          تعذّر تفعيل الإشعار الفوري. أعد تحميل الصفحة أو سجّل الدخول من جديد.
        </p>
      ) : null}

      {toasts.map((toast) => (
        <RequestToast
          key={toast.id}
          toast={toast}
          locale={locale}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
}
