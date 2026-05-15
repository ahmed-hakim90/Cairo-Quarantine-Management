"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { playFeedbackSound } from "@/lib/ui/feedback-sound";
import {
  registerFeedbackToast,
  type FeedbackToastApi,
  type FeedbackToastItem,
  type FeedbackToastKind,
} from "@/lib/ui/feedback-toast";

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;

const FeedbackToastContext = createContext<FeedbackToastApi | null>(null);

function toastStyles(kind: FeedbackToastKind) {
  if (kind === "success") {
    return "border-emerald-300 bg-emerald-50 text-emerald-900";
  }
  return "border-red-300 bg-red-50 text-red-900";
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: FeedbackToastItem;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex w-[min(100vw-2rem,22rem)] items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-semibold shadow-lg ${toastStyles(toast.kind)}`}
    >
      <p className="min-w-0 flex-1 leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-1 opacity-70 transition hover:opacity-100"
        aria-label="إغلاق"
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
  );
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<FeedbackToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: FeedbackToastKind, message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      playFeedbackSound(kind === "success" ? "success" : "error");

      setToasts((prev) => {
        const next = [...prev, { id, kind, message: trimmed }];
        if (next.length <= MAX_TOASTS) return next;
        const dropped = next.slice(next.length - MAX_TOASTS);
        const removed = next.slice(0, next.length - MAX_TOASTS);
        for (const item of removed) {
          const timer = timersRef.current.get(item.id);
          if (timer !== undefined) window.clearTimeout(timer);
          timersRef.current.delete(item.id);
        }
        return dropped;
      });

      const timer = window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const api = useMemo<FeedbackToastApi>(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
    }),
    [push],
  );

  useEffect(() => {
    registerFeedbackToast(api);
    return () => {
      registerFeedbackToast({
        success: () => {},
        error: () => {},
      });
      const timers = timersRef.current;
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, [api]);

  return (
    <FeedbackToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed top-20 end-4 z-[95] flex flex-col items-end gap-2"
        aria-hidden={toasts.length === 0}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastCard toast={toast} onDismiss={() => dismiss(toast.id)} />
          </div>
        ))}
      </div>
    </FeedbackToastContext.Provider>
  );
}

export function useFeedbackToast(): FeedbackToastApi {
  const ctx = useContext(FeedbackToastContext);
  if (!ctx) {
    throw new Error("useFeedbackToast must be used within FeedbackProvider");
  }
  return ctx;
}
