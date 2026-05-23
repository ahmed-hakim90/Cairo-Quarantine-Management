"use client";

import { useEffect, useRef } from "react";
import type { Office } from "@/lib/office-requests/types";
import type { LandingMessages } from "@/lib/i18n/landing-messages";
import { formatOfficeWorkingHours } from "@/lib/landing/format-office-hours";
import { resolveOfficeMapUrl } from "@/lib/google-maps-url";
import type { Locale } from "@/lib/i18n/config";

type OfficeDetailDialogProps = {
  office: Office | null;
  locale: Locale;
  copy: LandingMessages["offices"]["dialog"];
  onClose: () => void;
};

export function OfficeDetailDialog({
  office,
  locale,
  copy,
  onClose,
}: OfficeDetailDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!office) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [office, onClose]);

  if (!office) return null;

  const hours = formatOfficeWorkingHours(office.workingHours, locale);
  const mapsUrl = resolveOfficeMapUrl({
    mapsUrl: office.mapsUrl,
    placeTitle: office.nameAr,
    address: office.addressAr,
    locale,
  });

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-landing-primary/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="office-dialog-title"
      onClick={onClose}
    >
      <div
        className="glass-panel max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="office-dialog-title"
          className="font-heading text-xl font-bold text-landing-primary"
        >
          {copy.title}
        </h3>
        <p className="mt-2 font-semibold text-landing-primary">{office.nameAr}</p>
        <p className="mt-1 text-sm text-landing-primary/75">{office.addressAr}</p>

        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="font-semibold text-landing-primary">{copy.phone}</dt>
            <dd className="mt-1 text-landing-primary/80">
              {office.phone ? (
                <a
                  href={`tel:${office.phone.replace(/\s/g, "")}`}
                  className="underline underline-offset-2"
                >
                  {office.phone}
                </a>
              ) : (
                copy.phoneMissing
              )}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-landing-primary">{copy.hours}</dt>
            <dd className="mt-1 text-landing-primary/80">
              {hours ?? copy.hoursMissing}
            </dd>
          </div>
        </dl>

        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-landing-primary px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
          >
            {copy.maps}
          </a>
        ) : null}

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-landing-primary/20 py-3 text-sm font-semibold text-landing-primary transition-colors hover:bg-landing-primary/5"
        >
          {copy.close}
        </button>
      </div>
    </div>
  );
}
