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

export function highlightOfficeElement(el: HTMLElement) {
  el.classList.add("office-search-highlight");
  window.setTimeout(() => el.classList.remove("office-search-highlight"), 2500);
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
  if (id.startsWith("office-")) highlightOfficeElement(el);
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
