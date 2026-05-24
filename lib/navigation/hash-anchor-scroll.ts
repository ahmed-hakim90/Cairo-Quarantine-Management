export function officeIdFromHash(hashId: string): string | null {
  if (!hashId.startsWith("office-")) return null;
  const officeId = hashId.slice("office-".length);
  return officeId.length > 0 ? officeId : null;
}

function isVisibleElement(el: HTMLElement): boolean {
  return el.getClientRects().length > 0;
}

export function findOfficeRowElement(officeId: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(
    `[data-office-id="${CSS.escape(officeId)}"]`,
  );
  for (const el of nodes) {
    if (isVisibleElement(el)) return el;
  }
  return nodes[0] ?? null;
}

export function findHashTarget(hashId: string): HTMLElement | null {
  const officeId = officeIdFromHash(hashId);
  if (officeId) return findOfficeRowElement(officeId);
  return document.getElementById(hashId);
}

const SEARCH_HIGHLIGHT_MS = 3000;
/** Wait for nested client components to finish hydrating before applying class. */
const SEARCH_HIGHLIGHT_DELAY_MS = 400;

const highlightScheduleTimers = new WeakMap<HTMLElement, number>();

export function highlightSearchTarget(el: HTMLElement) {
  const prev = highlightScheduleTimers.get(el);
  if (prev !== undefined) window.clearTimeout(prev);

  const timer = window.setTimeout(() => {
    highlightScheduleTimers.delete(el);
    if (!document.contains(el)) return;
    el.classList.add("site-search-highlight");
    window.setTimeout(
      () => el.classList.remove("site-search-highlight"),
      SEARCH_HIGHLIGHT_MS,
    );
  }, SEARCH_HIGHLIGHT_DELAY_MS);

  highlightScheduleTimers.set(el, timer);
}

export function revealHiddenScrollRevealAncestors(el: HTMLElement) {
  let parent = el.parentElement;
  while (parent) {
    if (
      parent.classList.contains("opacity-0") &&
      parent.classList.contains("translate-y-8")
    ) {
      parent.classList.remove("opacity-0", "translate-y-8");
      parent.classList.add("opacity-100", "translate-y-0");
    }
    parent = parent.parentElement;
  }
}

export function scrollToHashAnchor(): boolean {
  const hash = window.location.hash;
  if (!hash) return false;

  const id = decodeURIComponent(hash.slice(1));
  const el = findHashTarget(id);
  if (!el) return false;

  revealHiddenScrollRevealAncestors(el);
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  highlightSearchTarget(el);
  return true;
}

export function hashScrollDelays(hashId: string): number[] {
  if (hashId === "destination-country-requirements") {
    return [0, 100, 250, 500, 800, 1200];
  }
  if (hashId.startsWith("office-")) {
    return [0, 100, 250, 500, 800, 1200, 1500];
  }
  return [0, 100, 250, 500, 800];
}

export function scheduleHashScroll(
  hashId: string,
  scroll = scrollToHashAnchor,
): () => void {
  if (scroll()) return () => {};

  const timers = hashScrollDelays(hashId).map((ms) =>
    window.setTimeout(() => scroll(), ms),
  );

  return () => timers.forEach((t) => window.clearTimeout(t));
}
