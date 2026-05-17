"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import type { Office } from "@/lib/office-requests/types";

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
    let captureEl: HTMLDivElement | null = null;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");
      const qrUrl =
        qrDataUrl ??
        (await QRCode.toDataURL(checkinUrl, {
          margin: 1,
          width: 320,
          errorCorrectionLevel: "M",
          color: { dark: "#0c2340", light: "#ffffff" },
        }));
      captureEl = buildPdfCaptureCard({ office, checkinUrl, qrDataUrl: qrUrl });
      document.body.appendChild(captureEl);
      const canvas = await html2canvas(captureEl, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
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
      captureEl?.remove();
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
            <p className="mt-3 break-all text-center text-xs text-gov-gray-600">
              {checkinUrl}
            </p>
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

function buildPdfCaptureCard({
  office,
  checkinUrl,
  qrDataUrl,
}: {
  office: Office;
  checkinUrl: string;
  qrDataUrl: string;
}) {
  const root = document.createElement("div");
  root.dir = "rtl";
  root.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    "width:560px",
    "min-height:780px",
    "box-sizing:border-box",
    "padding:36px",
    "background:#ffffff",
    "color:#0c2340",
    "border:1px solid #dfe4ea",
    "font-family:Arial,Tahoma,sans-serif",
    "text-align:center",
  ].join(";");

  const title = document.createElement("p");
  title.textContent = "إدارة الحجر الصحي بالقاهرة";
  title.style.cssText =
    "margin:0;color:#0f766e;font-size:18px;font-weight:700;";
  root.appendChild(title);

  const officeName = document.createElement("h1");
  officeName.textContent = office.nameAr;
  officeName.style.cssText =
    "margin:18px 0 8px;color:#0c2340;font-size:30px;font-weight:800;line-height:1.35;";
  root.appendChild(officeName);

  const address = document.createElement("p");
  address.textContent = office.addressAr;
  address.style.cssText =
    "margin:0 auto 28px;max-width:460px;color:#374151;font-size:17px;line-height:1.7;";
  root.appendChild(address);

  const qrWrap = document.createElement("div");
  qrWrap.style.cssText =
    "display:inline-block;margin:0 auto;padding:16px;background:#ffffff;border:1px solid #dfe4ea;border-radius:12px;";
  const img = document.createElement("img");
  img.src = qrDataUrl;
  img.alt = "";
  img.width = 300;
  img.height = 300;
  img.style.cssText = "display:block;width:300px;height:300px;";
  qrWrap.appendChild(img);
  root.appendChild(qrWrap);

  const message = document.createElement("p");
  message.textContent =
    "امسح الكود لتسجيل الحضور وإضافة طلبك إلى طابور اليوم";
  message.style.cssText =
    "margin:28px auto 18px;max-width:460px;color:#0c2340;font-size:20px;font-weight:700;line-height:1.7;";
  root.appendChild(message);

  const url = document.createElement("p");
  url.textContent = checkinUrl;
  url.style.cssText =
    "margin:0 auto;max-width:460px;color:#4a5568;font-size:13px;line-height:1.6;word-break:break-all;direction:ltr;";
  root.appendChild(url);

  return root;
}
