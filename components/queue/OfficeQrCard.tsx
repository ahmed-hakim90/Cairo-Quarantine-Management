"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import type { Office } from "@/lib/office-requests/types";
import { BRAND_ACCENT, BRAND_PRIMARY_DEEP } from "@/lib/theme/brand-colors";

type OfficeQrCardProps = {
  locale: string;
  office: Office;
  checkinUrl: string;
};

export function OfficeQrCard({ locale, office, checkinUrl }: OfficeQrCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!showQr || !checkinUrl) return;
    let cancelled = false;
    QRCode.toDataURL(checkinUrl, {
      margin: 1,
      width: 280,
      errorCorrectionLevel: "M",
      color: { dark: BRAND_PRIMARY_DEEP, light: "#ffffff" },
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
  }, [checkinUrl, showQr]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(checkinUrl);
    } catch {
      /* ignore */
    }
  }

  async function downloadPdf() {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const qrUrl =
        qrDataUrl ??
        (await QRCode.toDataURL(checkinUrl, {
          margin: 1,
          width: 320,
          errorCorrectionLevel: "M",
          color: { dark: BRAND_PRIMARY_DEEP, light: "#ffffff" },
        }));
      const canvas = await composeQrCardCanvas({ office, qrDataUrl: qrUrl });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height) * 0.9;
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.addImage(img, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
      pdf.save(`checkin-${office.id}.pdf`);
    } catch (error) {
      console.error("Failed to export QR card PDF", error);
    } finally {
      setBusy(false);
    }
  }

  function printCard() {
    const el = cardRef.current;
    if (!el) return;
    const w = window.open("", "_blank", "noopener,noreferrer,width=480,height=720");
    if (!w) return;
    w.document.write(
      `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${office.nameAr}</title><style>body{font-family:system-ui,sans-serif;padding:24px;margin:0}img{max-width:100%}</style></head><body>${el.innerHTML}</body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <article className="flex flex-col rounded-lg border border-gov-gray-200 bg-white shadow-sm">
      <div ref={cardRef} className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-lg font-extrabold text-gov-navy">
              {office.nameAr}
            </h3>
            <p className="mt-1 text-sm text-gov-gray-600">{office.addressAr}</p>
          </div>
          {office.active ? (
            <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-800 ring-1 ring-emerald-100">
              نشط
            </span>
          ) : (
            <span className="shrink-0 rounded-md bg-gov-gray-100 px-2 py-1 text-xs font-extrabold text-gov-gray-700">
              معطّل
            </span>
          )}
        </div>

        {showQr ? (
          <div className="mt-5 flex flex-col items-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`QR حضور ${office.nameAr}`}
                width={200}
                height={200}
                className="rounded-lg border border-gov-gray-200 bg-white p-2"
              />
            ) : (
              <div
                className="flex h-[200px] w-[200px] items-center justify-center rounded-lg border border-gov-gray-200 bg-gov-gray-50 text-sm text-gov-gray-600"
                aria-hidden
              >
                …
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-gov-gray-100 p-4">
        {office.active ? (
          <Link
            href={`/${locale}/office-dashboard/${office.id}/queue`}
            className="inline-flex min-h-9 w-full items-center justify-center rounded-md bg-gov-navy px-3 text-xs font-bold text-white hover:bg-gov-accent"
          >
            فتح الطابور
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          className="inline-flex min-h-9 flex-1 items-center justify-center rounded-md bg-gov-accent px-3 text-xs font-bold text-white hover:bg-gov-navy"
        >
          {showQr ? "إخفاء QR" : "عرض QR"}
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex min-h-9 items-center justify-center rounded-md border border-gov-gray-200 px-3 text-xs font-bold text-gov-navy hover:bg-gov-gray-50"
        >
          نسخ الرابط
        </button>
        <button
          type="button"
          disabled={busy || !showQr}
          onClick={() => void downloadPdf()}
          className="inline-flex min-h-9 items-center justify-center rounded-md border border-gov-gray-200 px-3 text-xs font-bold text-gov-navy hover:bg-gov-gray-50 disabled:opacity-50"
        >
          تحميل PDF
        </button>
        <button
          type="button"
          disabled={!showQr}
          onClick={printCard}
          className="inline-flex min-h-9 items-center justify-center rounded-md border border-gov-gray-200 px-3 text-xs font-bold text-gov-navy hover:bg-gov-gray-50 disabled:opacity-50"
        >
          طباعة
        </button>
      </div>
    </article>
  );
}

async function composeQrCardCanvas({
  office,
  qrDataUrl,
}: {
  office: Office;
  qrDataUrl: string;
}): Promise<HTMLCanvasElement> {
  await document.fonts.ready.catch(() => undefined);

  const canvas = document.createElement("canvas");
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas غير متاح.");

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, BRAND_PRIMARY_DEEP);
  grad.addColorStop(0.45, BRAND_PRIMARY_DEEP);
  grad.addColorStop(1, BRAND_ACCENT);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(204,251,241,0.95)";
  ctx.font = 'bold 34px "IBM Plex Sans Arabic", Almarai, system-ui, sans-serif';
  ctx.fillText("إدارة الحجر الصحي بالقاهرة", W / 2, 125);

  ctx.fillStyle = "#ffffff";
  ctx.font = 'bold 68px "IBM Plex Sans Arabic", Almarai, system-ui, sans-serif';
  drawCenteredLines(ctx, office.nameAr, W / 2, 225, 820, 78, 2);

  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.font = '30px "IBM Plex Sans Arabic", Almarai, system-ui, sans-serif';
  drawCenteredLines(ctx, office.addressAr, W / 2, 375, 820, 44, 2);

  const img = await loadImage(qrDataUrl);
  const qw = 430;
  const qh = 430;
  const qx = (W - qw) / 2;
  const qy = 515;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 26;
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(qx - 18, qy - 18, qw + 36, qh + 36, 24);
  } else {
    ctx.rect(qx - 18, qy - 18, qw + 36, qh + 36);
  }
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.drawImage(img, qx, qy, qw, qh);

  ctx.fillStyle = "#ffffff";
  ctx.font = 'bold 42px "IBM Plex Sans Arabic", Almarai, system-ui, sans-serif';
  drawCenteredLines(
    ctx,
    "امسح الكود لتسجيل الحضور وإضافة طلبك إلى طابور اليوم",
    W / 2,
    1065,
    840,
    58,
    2,
  );

  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("تعذر تحميل صورة QR."));
    img.src = src;
  });
}

function drawCenteredLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const lines = wrapCanvasText(ctx, text, maxWidth, maxLines);
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.length > 0) {
    const last = lines[maxLines - 1];
    if (ctx.measureText(text).width > maxWidth * maxLines) {
      lines[maxLines - 1] = trimCanvasText(ctx, last, maxWidth);
    }
  }

  return lines;
}

function trimCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}
