"use client";

import { useState } from "react";
import {
  PublicSiteSearch,
  PublicSiteSearchTrigger,
} from "@/components/layout/PublicSiteSearch";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type PublicHeaderSiteSearchProps = {
  locale: Locale;
  messages: Messages;
};

export function PublicHeaderSiteSearch({
  locale,
  messages,
}: PublicHeaderSiteSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const b = messages.bottomNav;
  const n = messages.nav;

  return (
    <>
      <PublicSiteSearchTrigger
        variant="header"
        labels={b}
        onClick={() => setSearchOpen(true)}
      />
      <PublicSiteSearch
        locale={locale}
        labels={b}
        nav={n}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </>
  );
}
