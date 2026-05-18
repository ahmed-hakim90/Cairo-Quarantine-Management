"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import type { Messages } from "@/lib/i18n/messages";

type ConditionalSiteFooterProps = {
  messages: Messages;
};

const footerHiddenSegments = new Set(["booking", "complaint", "checkin"]);

export function ConditionalSiteFooter({
  messages,
}: ConditionalSiteFooterProps) {
  const pathname = usePathname();
  const [, , pageSegment] = pathname.split("/");

  if (footerHiddenSegments.has(pageSegment)) return null;

  return <SiteFooter messages={messages} />;
}
