"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { PublicFormType } from "@/lib/analytics/public-analytics-types";
import {
  FORM_IDLE_ABANDON_MS,
  HEARTBEAT_MS,
  trackPublicEvent,
  trackPublicFormAbandon,
  trackPublicFormStart,
  trackPublicFormStep,
  trackPublicApiError,
  setPublicFormActive,
  getVisitorSessionId,
} from "@/lib/analytics/public-analytics-client";
import type { Locale } from "@/lib/i18n/config";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

type PublicAnalyticsContextValue = {
  locale: Locale;
  trackFormStart: (formType: PublicFormType, step?: string) => void;
  trackFormStep: (args: {
    formType: PublicFormType;
    step: string;
    officeId?: string;
    phone?: string;
    preferredDate?: string;
  }) => void;
  trackSubmitAttempt: (formType: PublicFormType) => void;
  trackSubmitSuccess: (formType: PublicFormType, requestId?: string) => void;
  trackApiError: (errorCode: string) => void;
  clearForm: () => void;
  sessionId: string;
};

const PublicAnalyticsContext = createContext<PublicAnalyticsContextValue | null>(
  null,
);

function localeFromPath(pathname: string): Locale {
  const seg = pathname.split("/").filter(Boolean)[0];
  return isLocale(seg) ? seg : defaultLocale;
}

export function PublicAnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const lastPathRef = useRef<string | null>(null);
  const sessionStartedRef = useRef(false);
  const formIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetFormIdleTimer = useCallback(() => {
    if (formIdleTimerRef.current) clearTimeout(formIdleTimerRef.current);
    formIdleTimerRef.current = setTimeout(() => {
      trackPublicFormAbandon(locale);
    }, FORM_IDLE_ABANDON_MS);
  }, [locale]);

  useEffect(() => {
    if (pathname.includes("/admin")) return;

    getVisitorSessionId();
    if (!sessionStartedRef.current) {
      sessionStartedRef.current = true;
      trackPublicEvent({ action: "session.start", path: pathname, locale });
    }

    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      trackPublicEvent({ action: "page.view", path: pathname, locale });
    }
  }, [pathname, locale]);

  useEffect(() => {
    if (pathname.includes("/admin")) return;

    const heartbeat = setInterval(() => {
      trackPublicEvent({
        action: "session.heartbeat",
        path: pathname,
        locale,
        meta: { durationSeconds: HEARTBEAT_MS / 1000 },
      });
    }, HEARTBEAT_MS);

    const onUnload = () => trackPublicFormAbandon(locale);
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
    };
  }, [pathname, locale]);

  const trackFormStart = useCallback(
    (formType: PublicFormType, step?: string) => {
      trackPublicFormStart({ formType, locale, step });
      resetFormIdleTimer();
    },
    [locale, resetFormIdleTimer],
  );

  const trackFormStep = useCallback(
    (args: {
      formType: PublicFormType;
      step: string;
      officeId?: string;
      phone?: string;
      preferredDate?: string;
    }) => {
      trackPublicFormStep({ ...args, locale });
      resetFormIdleTimer();
    },
    [locale, resetFormIdleTimer],
  );

  const trackSubmitAttempt = useCallback(
    (formType: PublicFormType) => {
      trackPublicEvent({
        action: "form.submit_attempt",
        locale,
        meta: { formType },
      });
      resetFormIdleTimer();
    },
    [locale, resetFormIdleTimer],
  );

  const trackSubmitSuccess = useCallback(
    (formType: PublicFormType, requestId?: string) => {
      trackPublicEvent({
        action: "form.submit_success",
        locale,
        meta: {
          formType,
          ...(requestId ? { requestId } : {}),
        },
      });
      setPublicFormActive(false);
      if (formIdleTimerRef.current) clearTimeout(formIdleTimerRef.current);
    },
    [locale],
  );

  const trackApiError = useCallback(
    (errorCode: string) => {
      trackPublicApiError({ locale, errorCode });
    },
    [locale],
  );

  const clearForm = useCallback(() => {
    setPublicFormActive(false);
    if (formIdleTimerRef.current) clearTimeout(formIdleTimerRef.current);
  }, []);

  const value: PublicAnalyticsContextValue = {
    locale,
    trackFormStart,
    trackFormStep,
    trackSubmitAttempt,
    trackSubmitSuccess,
    trackApiError,
    clearForm,
    sessionId: getVisitorSessionId(),
  };

  return (
    <PublicAnalyticsContext.Provider value={value}>
      {children}
    </PublicAnalyticsContext.Provider>
  );
}

export function usePublicAnalytics(): PublicAnalyticsContextValue {
  const ctx = useContext(PublicAnalyticsContext);
  if (!ctx) {
    throw new Error("usePublicAnalytics must be used within PublicAnalyticsProvider");
  }
  return ctx;
}

export function useOptionalPublicAnalytics(): PublicAnalyticsContextValue | null {
  return useContext(PublicAnalyticsContext);
}
