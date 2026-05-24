"use client";

import { useEffect } from "react";
import {
  officeIdFromHash,
  scheduleHashScroll,
  scrollToHashAnchor,
} from "@/lib/navigation/hash-anchor-scroll";

/** Fallback scroll/highlight when the offices table mounts after hash navigation. */
export function OfficeTableHashScroll() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const hashId = decodeURIComponent(hash.slice(1));
    if (!officeIdFromHash(hashId)) return;

    return scheduleHashScroll(hashId, scrollToHashAnchor);
  }, []);

  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash;
      if (!hash) return;
      const hashId = decodeURIComponent(hash.slice(1));
      if (!officeIdFromHash(hashId)) return;
      scheduleHashScroll(hashId, scrollToHashAnchor);
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}
