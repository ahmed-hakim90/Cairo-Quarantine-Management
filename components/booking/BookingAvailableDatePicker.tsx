"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/lib/i18n/config";

const CAIRO_TZ = "Africa/Cairo";
const POPOVER_WIDTH = 272;

type BookingAvailableDatePickerProps = {
  locale: Locale;
  name: string;
  value: string;
  onChange: (ymd: string) => void;
  availableDates: Set<string>;
  fullDates?: Set<string>;
  fromYmd: string;
  toYmd: string;
  loading?: boolean;
  disabled?: boolean;
  disabledHint?: string;
  placeholderLabel: string;
  loadingLabel: string;
  prevMonthLabel: string;
  nextMonthLabel: string;
  containerRef?: RefObject<HTMLDivElement | null>;
};

function localeTag(locale: Locale): string {
  if (locale === "ar") return "ar-EG";
  if (locale === "zh") return "zh-CN";
  if (locale === "fr") return "fr-FR";
  return "en-GB";
}

function parseYmd(ymd: string): { year: number; month: number; day: number } {
  const [y, m, d] = ymd.split("-").map((part) => Number.parseInt(part, 10));
  return { year: y, month: m, day: d };
}

function ymdFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addMonths(year: number, month: number, delta: number): {
  year: number;
  month: number;
} {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

function compareMonth(
  aYear: number,
  aMonth: number,
  bYear: number,
  bMonth: number,
): number {
  return aYear * 12 + aMonth - (bYear * 12 + bMonth);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function weekdayIndex(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function initialVisibleMonth(
  value: string,
  fromYmd: string,
  availableDates: Set<string>,
): { year: number; month: number } {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const { year, month } = parseYmd(value);
    return { year, month };
  }
  if (fromYmd && /^\d{4}-\d{2}-\d{2}$/.test(fromYmd)) {
    const { year, month } = parseYmd(fromYmd);
    return { year, month };
  }
  const first = [...availableDates].sort()[0];
  if (first) {
    const { year, month } = parseYmd(first);
    return { year, month };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function formatDisplayDate(ymd: string, tag: string): string {
  return new Intl.DateTimeFormat(tag, {
    timeZone: CAIRO_TZ,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${ymd}T12:00:00+02:00`));
}

function computePopoverStyle(trigger: HTMLElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const viewportPadding = 8;
  const width = Math.min(POPOVER_WIDTH, Math.max(rect.width, 240));
  let left = rect.left;
  if (left + width > window.innerWidth - viewportPadding) {
    left = window.innerWidth - width - viewportPadding;
  }
  left = Math.max(viewportPadding, left);

  return {
    position: "fixed",
    left,
    width,
    top: rect.bottom + 4,
    zIndex: 9999,
  };
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="size-4 shrink-0 text-gov-gray-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <rect x="2.5" y="4" width="15" height="13" rx="1.5" />
      <path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" strokeLinecap="round" />
    </svg>
  );
}

export function BookingAvailableDatePicker({
  locale,
  name,
  value,
  onChange,
  availableDates,
  fullDates = new Set(),
  fromYmd,
  toYmd,
  loading = false,
  disabled = false,
  disabledHint,
  placeholderLabel,
  loadingLabel,
  prevMonthLabel,
  nextMonthLabel,
  containerRef,
}: BookingAvailableDatePickerProps) {
  const tag = localeTag(locale);
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  const fromParts = parseYmd(fromYmd);
  const toParts = parseYmd(toYmd);

  const [visible, setVisible] = useState(() =>
    initialVisibleMonth(value, fromYmd, availableDates),
  );

  useEffect(() => {
    if (!value) return;
    const { year, month } = parseYmd(value);
    setVisible({ year, month });
  }, [value]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      if (triggerRef.current) {
        setPopoverStyle(computePopoverStyle(triggerRef.current));
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const monthTitle = useMemo(() => {
    const sample = ymdFromParts(visible.year, visible.month, 1);
    return new Intl.DateTimeFormat(tag, {
      timeZone: CAIRO_TZ,
      month: "long",
      year: "numeric",
    }).format(new Date(`${sample}T12:00:00+02:00`));
  }, [tag, visible.month, visible.year]);

  const weekdayLabels = useMemo(() => {
    const base = new Date(Date.UTC(2024, 0, 7));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(base.getTime() + index * 86400000);
      return new Intl.DateTimeFormat(tag, { weekday: "narrow" }).format(date);
    });
  }, [tag]);

  const canGoPrev =
    compareMonth(
      visible.year,
      visible.month,
      fromParts.year,
      fromParts.month,
    ) > 0;
  const canGoNext =
    compareMonth(
      visible.year,
      visible.month,
      toParts.year,
      toParts.month,
    ) < 0;

  const gridDays = useMemo(() => {
    const total = daysInMonth(visible.year, visible.month);
    const leading = weekdayIndex(visible.year, visible.month, 1);
    const cells: Array<
      | { kind: "empty"; key: string }
      | {
          kind: "day";
          key: string;
          ymd: string;
          day: number;
          selectable: boolean;
          full: boolean;
          selected: boolean;
        }
    > = [];

    for (let i = 0; i < leading; i++) {
      cells.push({ kind: "empty", key: `empty-${i}` });
    }

    for (let day = 1; day <= total; day++) {
      const ymd = ymdFromParts(visible.year, visible.month, day);
      const inRange = ymd >= fromYmd && ymd <= toYmd;
      const selectable = inRange && availableDates.has(ymd);
      const full = inRange && fullDates.has(ymd);
      cells.push({
        kind: "day",
        key: ymd,
        ymd,
        day,
        selectable,
        full,
        selected: value === ymd,
      });
    }

    return cells;
  }, [
    availableDates,
    fromYmd,
    fullDates,
    toYmd,
    value,
    visible.month,
    visible.year,
  ]);

  const pickerDisabled = disabled || loading;
  const displayValue = value ? formatDisplayDate(value, tag) : "";

  function handleSelect(ymd: string) {
    onChange(ymd);
    setOpen(false);
  }

  const popover =
    open && !pickerDisabled ? (
      <div
        ref={popoverRef}
        id={listboxId}
        role="dialog"
        aria-label={monthTitle}
        style={popoverStyle}
        className="rounded-md border border-gov-gray-200 bg-white p-2 shadow-lg ring-1 ring-black/5"
      >
        <div className="mb-1.5 flex items-center justify-between gap-1">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() =>
              setVisible((current) => addMonths(current.year, current.month, -1))
            }
            className="inline-flex size-7 items-center justify-center rounded border border-gov-gray-200 text-sm text-gov-navy transition hover:bg-gov-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={prevMonthLabel}
          >
            ‹
          </button>
          <p className="truncate px-1 text-xs font-extrabold text-gov-navy">
            {monthTitle}
          </p>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() =>
              setVisible((current) => addMonths(current.year, current.month, 1))
            }
            className="inline-flex size-7 items-center justify-center rounded border border-gov-gray-200 text-sm text-gov-navy transition hover:bg-gov-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={nextMonthLabel}
          >
            ›
          </button>
        </div>

        <div
          className="grid grid-cols-7 gap-0.5 text-center"
          role="grid"
          aria-label={monthTitle}
        >
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="py-0.5 text-[10px] font-bold text-gov-gray-500"
              role="columnheader"
            >
              {label}
            </div>
          ))}

          {gridDays.map((cell) => {
            if (cell.kind === "empty") {
              return <div key={cell.key} aria-hidden className="size-8" />;
            }

            const { ymd, day, selectable, full, selected } = cell;
            const title = new Intl.DateTimeFormat(tag, {
              timeZone: CAIRO_TZ,
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date(`${ymd}T12:00:00+02:00`));

            return (
              <button
                key={cell.key}
                type="button"
                role="gridcell"
                disabled={!selectable}
                aria-pressed={selected}
                aria-label={title}
                title={title}
                onClick={() => handleSelect(ymd)}
                className={`inline-flex size-8 items-center justify-center rounded text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gov-accent ${
                  selected
                    ? "bg-gov-accent text-white"
                    : selectable
                      ? "text-gov-navy hover:bg-gov-accent-muted"
                      : full
                        ? "cursor-not-allowed text-red-400 line-through decoration-red-400"
                        : "cursor-not-allowed text-gov-gray-400 line-through decoration-gov-gray-400"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={value} required={!pickerDisabled} />

      {disabled && disabledHint ? (
        <p className="text-sm font-semibold text-gov-gray-600">{disabledHint}</p>
      ) : (
        <>
          <button
            ref={triggerRef}
            type="button"
            disabled={pickerDisabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            onClick={() => {
              if (pickerDisabled) return;
              setOpen((current) => !current);
            }}
            className={`mt-2 flex w-full min-h-12 items-center justify-between gap-2 rounded-md border border-gov-gray-200 bg-white px-3.5 py-3 text-start text-base outline-none transition focus:border-gov-accent focus:ring-2 focus:ring-gov-accent/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-accent disabled:cursor-not-allowed disabled:bg-gov-gray-50 disabled:text-gov-gray-600 sm:min-h-0 sm:px-3 sm:py-3 sm:text-sm ${
              value ? "text-gov-gray-900" : "text-gov-gray-500"
            }`}
          >
            <span className="truncate">
              {loading ? loadingLabel : displayValue || placeholderLabel}
            </span>
            <CalendarIcon />
          </button>

          {loading ? (
            <p className="sr-only" role="status" aria-live="polite">
              {loadingLabel}
            </p>
          ) : null}
        </>
      )}

      {typeof document !== "undefined" && popover
        ? createPortal(popover, document.body)
        : null}
    </div>
  );
}
