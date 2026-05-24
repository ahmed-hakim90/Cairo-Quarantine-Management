"use client";

import { useMemo } from "react";
import {
  buildBookingPassUrl,
  buildOfficeCheckinUrl,
} from "@/lib/booking-pass-url";
import type { Locale } from "@/lib/i18n/config";

export type UseBookingPassUrlArgs = {
  locale: Locale;
  requestId: string;
  passToken: string;
  officeId?: string;
  /** When set (e.g. from booking page server), used before `window.location.origin`. */
  serverSiteOrigin?: string;
};

function resolveSiteOrigin(serverSiteOrigin = ""): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (env) return env;
  const s = serverSiteOrigin.trim().replace(/\/+$/, "");
  if (s) return s;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function useBookingPassUrl({
  locale,
  requestId,
  passToken,
  officeId,
  serverSiteOrigin = "",
}: UseBookingPassUrlArgs) {
  const origin = useMemo(
    () => resolveSiteOrigin(serverSiteOrigin),
    [serverSiteOrigin],
  );

  const passUrl = useMemo(() => {
    if (!origin || !passToken) return "";
    return buildBookingPassUrl(origin, locale, requestId, passToken);
  }, [origin, locale, requestId, passToken]);

  const queueUrl = useMemo(() => {
    if (!origin || !officeId) return "";
    return buildOfficeCheckinUrl(origin, locale, officeId, requestId);
  }, [origin, locale, officeId, requestId]);

  return { origin, passUrl, queueUrl };
}
