"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PUBLIC_FOOTER_HIDDEN_SEGMENTS } from "@/lib/layout/public-chrome";
import type { Messages } from "@/lib/i18n/messages";

type ConditionalSiteFooterProps = {
  messages: Messages;
};

export function ConditionalSiteFooter({
  messages,
}: ConditionalSiteFooterProps) {
  const pathname = usePathname();
  const [, , pageSegment] = pathname.split("/");

  if (PUBLIC_FOOTER_HIDDEN_SEGMENTS.has(pageSegment)) return null;

  return <SiteFooter messages={messages} />;
}
