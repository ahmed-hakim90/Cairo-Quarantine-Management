"use client";

import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { buildBookingPassUrl } from "@/lib/booking-pass-url";
import type { Locale } from "@/lib/i18n/config";

const QR_RENDER_WIDTH = 400;

export type UseBookingPassQrStateArgs = {
  locale: Locale;
  requestId: string;
  passToken: string;
  /** When set (e.g. from booking page server), used before `window.location.origin`. */
  serverSiteOrigin?: string;
};

export function useBookingPassQrState({
  locale,
  requestId,
  passToken,
  serverSiteOrigin = "",
}: UseBookingPassQrStateArgs) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const origin = useMemo(() => {
    const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
    if (env) return env;
    const s = serverSiteOrigin.trim().replace(/\/+$/, "");
    if (s) return s;
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, [serverSiteOrigin]);

  const passUrl = useMemo(() => {
    if (!origin || !passToken) return "";
    return buildBookingPassUrl(origin, locale, requestId, passToken);
  }, [origin, locale, requestId, passToken]);

  useEffect(() => {
    if (!passUrl) {
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(passUrl, {
      margin: 1,
      width: QR_RENDER_WIDTH,
      errorCorrectionLevel: "M",
      color: { dark: "#0c2340", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [passUrl]);

  return { passUrl, qrDataUrl: passUrl ? qrDataUrl : null };
}

export function BookingPassQrPicture({
  qrDataUrl,
  alt,
  displayWidth = 220,
  className = "rounded-lg border border-white/20 bg-white p-2 shadow-lg",
}: {
  qrDataUrl: string | null;
  alt: string;
  displayWidth?: number;
  className?: string;
}) {
  if (qrDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- dynamic data URL from QR
      <img
        src={qrDataUrl}
        alt={alt}
        width={displayWidth}
        height={displayWidth}
        className={className}
      />
    );
  }
  return (
    <div
      className="animate-pulse rounded-lg border border-gov-gray-200 bg-gov-gray-100"
      style={{ width: displayWidth, height: displayWidth }}
      role="status"
      aria-label="Loading QR code"
    />
  );
}

export type BookingPassQrImageProps = UseBookingPassQrStateArgs & {
  alt: string;
  displayWidth?: number;
  imgClassName?: string;
};

/** Self-contained QR for a booking pass URL (client-only pages). */
export function BookingPassQrImage({
  locale,
  requestId,
  passToken,
  serverSiteOrigin,
  alt,
  displayWidth = 220,
  imgClassName = "rounded-lg border border-gov-gray-200 bg-white p-2 shadow-sm",
}: BookingPassQrImageProps) {
  const { qrDataUrl } = useBookingPassQrState({
    locale,
    requestId,
    passToken,
    serverSiteOrigin,
  });
  return (
    <BookingPassQrPicture
      qrDataUrl={qrDataUrl}
      alt={alt}
      displayWidth={displayWidth}
      className={imgClassName}
    />
  );
}
