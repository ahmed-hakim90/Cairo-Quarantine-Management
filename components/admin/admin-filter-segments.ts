export const SEGMENT_TRAY =
  "flex min-w-0 flex-wrap justify-start gap-1 rounded-md bg-gov-gray-100 p-1";

export const segmentClass = (active: boolean) =>
  [
    "inline-flex min-h-9 shrink-0 items-center justify-center rounded-md px-3 py-1.5 text-center text-xs font-extrabold transition",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-gov-gray-100",
    active
      ? "bg-white text-gov-navy shadow-sm"
      : "text-gov-gray-600 hover:text-gov-navy",
  ].join(" ");

export const dateInputClass =
  "min-h-9 w-full min-w-0 rounded-md border border-gov-gray-200 bg-white px-2 text-xs font-bold text-gov-navy outline-none transition focus:border-gov-accent focus:ring-2 focus:ring-gov-accent/20 sm:w-32 sm:shrink-0";
