"use client";

import type { ReactNode } from "react";
import { publicMainBottomPadding } from "@/lib/layout/public-chrome";

type PublicMainContentProps = {
  children: ReactNode;
};

export function PublicMainContent({ children }: PublicMainContentProps) {
  return (
    <main
      id="main-content"
      className={`flex-1 md:pb-0 ${publicMainBottomPadding()}`}
    >
      {children}
    </main>
  );
}
