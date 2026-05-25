"use client";

import { useMemo } from "react";
import { SiteNavLinks, type SiteNavVariant } from "@/components/layout/SiteNavLinks";
import { useHasStoredRequests } from "@/lib/hooks/use-has-stored-requests";
import type { Locale } from "@/lib/i18n/config";

type NavItem = { href: string; label: string };

type PublicNavLinksProps = {
  locale: Locale;
  ariaLabel: string;
  baseItems: readonly NavItem[];
  myRequestsLabel: string;
  variant?: SiteNavVariant;
  onNavigate?: () => void;
};

export function PublicNavLinks({
  locale,
  ariaLabel,
  baseItems,
  myRequestsLabel,
  variant = "bar",
  onNavigate,
}: PublicNavLinksProps) {
  const hasStored = useHasStoredRequests();

  const items = useMemo(() => {
    if (!hasStored) return baseItems;
    return [
      ...baseItems,
      { href: "/my-requests", label: myRequestsLabel },
    ] as const;
  }, [baseItems, hasStored, myRequestsLabel]);

  return (
    <SiteNavLinks
      locale={locale}
      ariaLabel={ariaLabel}
      items={items}
      variant={variant}
      onNavigate={onNavigate}
    />
  );
}
