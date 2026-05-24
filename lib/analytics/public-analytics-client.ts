"use client";

import type { PublicAnalyticsAction, PublicFormType } from "@/lib/analytics/public-analytics-types";
import type { Locale } from "@/lib/i18n/config";
import { maskPhoneForAnalytics } from "@/lib/analytics/public-event-schema";

export const VISITOR_SESSION_COOKIE = "cqm_visitor_session";
const SESSION_STORAGE_KEY = "cqm_visitor_session";
const HEARTBEAT_MS = 120_000;
const FORM_IDLE_ABANDON_MS = 10 * 60_000;

export type PublicAnalyticsMeta = Record<
  string,
  string | number | boolean | undefined
>;

type TrackOptions = {
  action: PublicAnalyticsAction;
  path?: string;
  locale?: Locale;
  meta?: PublicAnalyticsMeta;
  keepalive?: boolean;
};

let cachedSessionId: string | null = null;
let formActive = false;
let formType: PublicFormType | undefined;
let formLastStep: string | undefined;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export function createVisitorSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getVisitorSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  const fromCookie = readCookie(VISITOR_SESSION_COOKIE);
  if (fromCookie) {
    cachedSessionId = fromCookie;
    return fromCookie;
  }
  try {
    const fromStorage = localStorage.getItem(SESSION_STORAGE_KEY);
    if (fromStorage) {
      cachedSessionId = fromStorage;
      writeCookie(VISITOR_SESSION_COOKIE, fromStorage, 60 * 60 * 24 * 30);
      return fromStorage;
    }
  } catch {
    /* ignore */
  }
  const next = createVisitorSessionId();
  cachedSessionId = next;
  writeCookie(VISITOR_SESSION_COOKIE, next, 60 * 60 * 24 * 30);
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  return next;
}

export function currentPathname(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

export function trackPublicEvent({
  action,
  path,
  locale,
  meta,
  keepalive = false,
}: TrackOptions): void {
  if (typeof window === "undefined") return;
  const pathname = path ?? currentPathname();
  if (pathname.includes("/admin")) return;

  const payload = {
    sessionId: getVisitorSessionId(),
    action,
    path: pathname,
    locale: locale ?? "ar",
    meta,
    deviceClass:
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 768px)").matches
        ? "mobile"
        : "desktop",
  };

  const body = JSON.stringify(payload);
  if (keepalive && navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/public/analytics",
      new Blob([body], { type: "application/json" }),
    );
    return;
  }

  void fetch("/api/public/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive,
    credentials: "same-origin",
  }).catch(() => {
    /* analytics must not break UX */
  });
}

export function setPublicFormActive(
  active: boolean,
  options?: { formType?: PublicFormType; step?: string },
): void {
  formActive = active;
  formType = options?.formType;
  formLastStep = options?.step;
}

export function trackPublicFormStep(args: {
  formType: PublicFormType;
  step: string;
  locale: Locale;
  officeId?: string;
  phone?: string;
  preferredDate?: string;
}): void {
  setPublicFormActive(true, { formType: args.formType, step: args.step });
  trackPublicEvent({
    action: "form.step",
    locale: args.locale,
    meta: {
      formType: args.formType,
      step: args.step,
      ...(args.officeId ? { officeId: args.officeId } : {}),
      ...(args.phone ? { maskedPhone: maskPhoneForAnalytics(args.phone) } : {}),
      ...(args.preferredDate ? { preferredDate: args.preferredDate } : {}),
    },
  });
}

export function trackPublicFormStart(args: {
  formType: PublicFormType;
  locale: Locale;
  step?: string;
}): void {
  setPublicFormActive(true, {
    formType: args.formType,
    step: args.step ?? "open",
  });
  trackPublicEvent({
    action: "form.start",
    locale: args.locale,
    meta: {
      formType: args.formType,
      step: args.step ?? "open",
    },
  });
}

export function trackPublicFormAbandon(locale: Locale): void {
  if (!formActive) return;
  trackPublicEvent({
    action: "form.abandon",
    locale,
    keepalive: true,
    meta: {
      ...(formType ? { formType } : {}),
      ...(formLastStep ? { step: formLastStep } : {}),
    },
  });
  setPublicFormActive(false);
}

export function trackPublicApiError(args: {
  locale: Locale;
  errorCode: string;
  path?: string;
}): void {
  trackPublicEvent({
    action: "api.error",
    locale: args.locale,
    path: args.path,
    meta: { errorCode: args.errorCode },
  });
}

export { HEARTBEAT_MS, FORM_IDLE_ABANDON_MS };
