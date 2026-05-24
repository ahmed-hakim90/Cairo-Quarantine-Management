import type { Locale } from "@/lib/i18n/config";
import { bookingPassFormCopy, bookingPassPdfCopy } from "@/lib/i18n/booking-pass-copy";
import type { OfficeRequestType } from "@/lib/office-requests/types";
import { BRAND_PRIMARY_DEEP, BRAND_SECONDARY } from "@/lib/theme/brand-colors";

export type BookingPassPdfInput = {
  locale: Locale;
  requestId: string;
  requestType: OfficeRequestType;
  officeNameAr: string;
  preferredDate?: string;
  passUrl: string;
  queueUrl?: string;
};

type LinkRegion = { x: number; y: number; w: number; h: number; url: string };

function canvasPrimaryFont(locale: Locale): string {
  if (locale === "zh") {
    return 'bold 44px "Noto Sans SC", "PingFang SC", sans-serif';
  }
  return 'bold 44px "IBM Plex Sans Arabic", Almarai, system-ui, sans-serif';
}

function canvasSecondaryFont(locale: Locale): string {
  if (locale === "zh") {
    return '28px "Noto Sans SC", "PingFang SC", sans-serif';
  }
  return '28px "IBM Plex Sans Arabic", Almarai, system-ui, sans-serif';
}

function canvasLinkFont(locale: Locale): string {
  if (locale === "zh") {
    return 'bold 26px "Noto Sans SC", "PingFang SC", sans-serif';
  }
  return 'bold 26px "IBM Plex Sans Arabic", Almarai, system-ui, sans-serif';
}

function drawLinkButton(
  ctx: CanvasRenderingContext2D,
  label: string,
  centerX: number,
  y: number,
  maxWidth: number,
): { x: number; y: number; w: number; h: number } {
  ctx.font = ctx.font;
  const metrics = ctx.measureText(label);
  const padX = 28;
  const padY = 16;
  const w = Math.min(maxWidth, metrics.width + padX * 2);
  const h = 56;
  const x = centerX - w / 2;

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, 14);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = BRAND_PRIMARY_DEEP;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, centerX, y + h / 2);

  return { x, y, w, h };
}

async function composePassCardCanvas(
  input: BookingPassPdfInput,
): Promise<{ canvas: HTMLCanvasElement; links: LinkRegion[] }> {
  const { locale, requestId, requestType, officeNameAr, preferredDate, passUrl, queueUrl } =
    input;
  const formCopy = bookingPassFormCopy[locale];
  const pdfCopy = bookingPassPdfCopy[locale];

  const canvas = document.createElement("canvas");
  const W = 1080;
  const H = queueUrl ? 1350 : 1200;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, BRAND_PRIMARY_DEEP);
  grad.addColorStop(0.45, BRAND_PRIMARY_DEEP);
  grad.addColorStop(1, BRAND_SECONDARY);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  await document.fonts.ready.catch(() => undefined);

  ctx.textAlign = "center";
  ctx.direction = locale === "ar" ? "rtl" : "ltr";

  ctx.fillStyle = "rgba(232,238,244,0.95)";
  ctx.font = "100px system-ui, emoji, sans-serif";
  ctx.fillText(requestType === "booking" ? "✈" : "📋", W / 2, 200);

  ctx.fillStyle = "#ffffff";
  ctx.font = canvasPrimaryFont(locale);
  ctx.fillText(formCopy.cardTitle, W / 2, 300);

  ctx.font = canvasSecondaryFont(locale);
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  const subtitle =
    requestType === "complaint" || requestType === "proposal"
      ? formCopy.cardSubtitleComplaint
      : formCopy.cardSubtitle;
  ctx.fillText(subtitle, W / 2, 360);

  const officeLine =
    preferredDate && requestType === "booking"
      ? `${officeNameAr} · ${preferredDate}`
      : officeNameAr;
  const officeDisplay = officeLine.length > 80 ? `${officeLine.slice(0, 77)}…` : officeLine;
  ctx.fillText(officeDisplay, W / 2, 420);

  ctx.font =
    locale === "zh"
      ? '26px "Noto Sans SC", monospace'
      : '26px "IBM Plex Sans Arabic", ui-monospace, monospace';
  ctx.fillStyle = "rgba(226,232,240,0.9)";
  ctx.fillText(`#${requestId}`, W / 2, 475);

  const links: LinkRegion[] = [];
  ctx.font = canvasLinkFont(locale);

  let linkY = 560;
  const trackingBtn = drawLinkButton(ctx, pdfCopy.trackingLinkLabel, W / 2, linkY, W - 120);
  links.push({ ...trackingBtn, url: passUrl });

  if (queueUrl) {
    linkY += 90;
    const queueBtn = drawLinkButton(ctx, pdfCopy.queueLinkLabel, W / 2, linkY, W - 120);
    links.push({ ...queueBtn, url: queueUrl });
    linkY += 80;
    ctx.font = canvasSecondaryFont(locale);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(pdfCopy.queueSameDayNote, W / 2, linkY);
  }

  ctx.font = canvasSecondaryFont(locale);
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  const noticeY = queueUrl ? linkY + 70 : linkY + 100;
  wrapCenteredText(ctx, pdfCopy.keepCardNotice, W / 2, noticeY, W - 140, 38);

  return { canvas, links };
}

function wrapCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => {
    ctx.fillText(l, centerX, startY + i * lineHeight);
  });
}

export async function generateBookingPassPdf(input: BookingPassPdfInput): Promise<Blob> {
  const { canvas, links } = await composePassCardCanvas(input);
  const img = canvas.toDataURL("image/png");
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageW / canvas.width, pageH / canvas.height) * 0.92;
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  const offsetX = (pageW - w) / 2;
  const offsetY = (pageH - h) / 2;
  pdf.addImage(img, "PNG", offsetX, offsetY, w, h);

  for (const link of links) {
    const x = offsetX + (link.x / canvas.width) * w;
    const y = offsetY + (link.y / canvas.height) * h;
    const lw = (link.w / canvas.width) * w;
    const lh = (link.h / canvas.height) * h;
    pdf.link(x, y, lw, lh, { url: link.url });
  }

  return pdf.output("blob");
}

export async function downloadBookingPassPdf(
  input: BookingPassPdfInput,
): Promise<void> {
  const blob = await generateBookingPassPdf(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cairo-pass-${input.requestId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
