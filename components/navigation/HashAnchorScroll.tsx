"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  scheduleHashScroll,
  scrollToHashAnchor,
} from "@/lib/navigation/hash-anchor-scroll";

function HashAnchorScrollInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const id = decodeURIComponent(hash.slice(1));
    return scheduleHashScroll(id, scrollToHashAnchor);
  }, [pathname, searchKey]);

  useEffect(() => {
    const onHashChange = () => scrollToHashAnchor();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}

/** Scrolls to `location.hash` after client navigations (Next.js Link defaults skip hash scroll). */
export function HashAnchorScroll() {
  return (
    <Suspense fallback={null}>
      <HashAnchorScrollInner />
    </Suspense>
  );
}
