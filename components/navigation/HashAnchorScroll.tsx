"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function scrollToHashAnchor(): boolean {
  const hash = window.location.hash;
  if (!hash) return false;

  const id = decodeURIComponent(hash.slice(1));
  const el = document.getElementById(id);
  if (!el) return false;

  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

/** Scrolls to `location.hash` after client navigations (Next.js Link defaults skip hash scroll). */
export function HashAnchorScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (!window.location.hash) return;

    if (scrollToHashAnchor()) return;

    const delays = [0, 100, 250, 500, 800];
    const timers = delays.map((ms) =>
      window.setTimeout(() => scrollToHashAnchor(), ms),
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [pathname]);

  useEffect(() => {
    const onHashChange = () => scrollToHashAnchor();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}
