"use client";

import { PublicAnalyticsProvider } from "@/components/analytics/PublicAnalyticsProvider";

export function PublicAnalyticsShell({ children }: { children: React.ReactNode }) {
  return <PublicAnalyticsProvider>{children}</PublicAnalyticsProvider>;
}
