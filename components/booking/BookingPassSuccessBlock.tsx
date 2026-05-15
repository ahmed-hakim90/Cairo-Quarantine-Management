"use client";

import { useCallback, useMemo } from "react";
import {
  BookingPassQrPicture,
  useBookingPassQrState,
} from "@/components/booking/BookingPassQrImage";
import { bookingPassFormCopy } from "@/lib/i18n/booking-pass-copy";
import type { Locale } from "@/lib/i18n/config";
import type { PublicOfficeRequestStatus } from "@/lib/office-requests/types";

type BookingPassSuccessBlockProps = {
  locale: Locale;
  request: PublicOfficeRequestStatus & { passToken: string };
  /** From request `headers()` on the booking page server. */
  serverSiteOrigin: string;
};

function canvasPrimaryFont(locale: Locale): string {
  if (locale === "zh") {
    return 'bold 48px "Noto Sans SC", "PingFang SC", sans-serif';
  }
  return 'bold 48px "IBM Plex Sans Arabic", Almarai, system-ui, sans-serif';
}

function canvasSecondaryFont(locale: Locale): string {
  if (locale === "zh") {
    return '30px "Noto Sans SC", "PingFang SC", sans-serif';
  }
  return '30px "IBM Plex Sans Arabic", Almarai, system-ui, sans-serif';
}

export function BookingPassSuccessBlock({
  locale,
  request,
  serverSiteOrigin,
}: BookingPassSuccessBlockProps) {
  const c = bookingPassFormCopy[locale];

  const { passUrl, qrDataUrl } = useBookingPassQrState({
    locale,
    requestId: request.id,
    passToken: request.passToken,
    serverSiteOrigin,
  });

  const cardLines = useMemo(() => {
    const parts = [request.officeNameAr];
    if (request.preferredDate) parts.push(request.preferredDate);
    return parts.join(locale === "ar" ? " · " : " · ");
  }, [request.officeNameAr, request.preferredDate, locale]);

  const composeCardBlob = useCallback(async (): Promise<Blob | null> => {
    if (!qrDataUrl) return null;
    const canvas = document.createElement("canvas");
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#081828");
    grad.addColorStop(0.45, "#0c2340");
    grad.addColorStop(1, "#0f766e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, W - 72, H - 72);

    await document.fonts.ready.catch(() => undefined);

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(204,251,241,0.95)";
    ctx.font = "110px system-ui, emoji, sans-serif";
    ctx.fillText("✈", W / 2, 220);

    ctx.fillStyle = "#ffffff";
    ctx.font = canvasPrimaryFont(locale);
    ctx.direction = locale === "ar" ? "rtl" : "ltr";
    ctx.fillText(c.cardTitle, W / 2, 340);

    ctx.font = canvasSecondaryFont(locale);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    const sub = cardLines.length > 80 ? `${cardLines.slice(0, 77)}…` : cardLines;
    ctx.fillText(sub, W / 2, 410);

    ctx.font =
      locale === "zh"
        ? '26px "Noto Sans SC", monospace'
        : '26px "IBM Plex Sans Arabic", ui-monospace, monospace';
    ctx.fillStyle = "rgba(226,232,240,0.9)";
    ctx.fillText(`#${request.id}`, W / 2, 470);

    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const qw = 420;
        const qh = 420;
        const qx = (W - qw) / 2;
        const qy = H - qh - 120;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 24;
        ctx.beginPath();
        const r = 20;
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(qx - 16, qy - 16, qw + 32, qh + 32, r);
        } else {
          ctx.rect(qx - 16, qy - 16, qw + 32, qh + 32);
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.drawImage(img, qx, qy, qw, qh);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = qrDataUrl;
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 0.92);
    });
  }, [qrDataUrl, c.cardTitle, cardLines, locale, request.id]);

  const downloadCard = useCallback(async () => {
    const blob = await composeCardBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cairo-booking-${request.id}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, [composeCardBlob, request.id]);

  const shareCard = useCallback(async () => {
    const blob = await composeCardBlob();
    if (!blob) return;
    const file = new File([blob], `cairo-booking-${request.id}.png`, {
      type: "image/png",
    });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: c.cardTitle,
          text: cardLines,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      await downloadCard();
    }
  }, [composeCardBlob, downloadCard, c.cardTitle, cardLines, request.id]);

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-emerald-200/60 bg-gradient-to-b from-gov-navy-deep/95 to-gov-navy p-5 text-white shadow-inner">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-teal-200/90">
          {request.type === "complaint" ? c.cardSubtitleComplaint : c.cardSubtitle}
        </p>
        {passUrl ? (
          <p className="mt-1 break-all font-mono text-[10px] text-teal-100/70">
            {passUrl}
          </p>
        ) : (
          <p className="mt-2 text-xs font-semibold leading-relaxed text-amber-200/95">
            {c.siteUrlHint}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-3">
        <BookingPassQrPicture
          qrDataUrl={qrDataUrl}
          alt={c.qrAlt}
          displayWidth={220}
          className="rounded-lg border border-white/20 bg-white p-2 shadow-lg"
        />
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => void downloadCard()}
            disabled={!qrDataUrl}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-teal-500 px-4 text-sm font-bold text-white shadow transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {c.downloadPng}
          </button>
          <button
            type="button"
            onClick={() => void shareCard()}
            disabled={!qrDataUrl}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/30 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {c.shareCard}
          </button>
        </div>
      </div>
    </div>
  );
}
