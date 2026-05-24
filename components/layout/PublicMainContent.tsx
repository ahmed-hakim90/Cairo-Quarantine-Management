"use client";

import type { ReactNode } from "react";
import { PUBLIC_MAIN_BOTTOM_PAD_CLASS } from "@/lib/layout/public-chrome";

type PublicMainContentProps = {
  children: ReactNode;
};

export function PublicMainContent({ children }: PublicMainContentProps) {
  return (
    <main
      id="main-content"
      className={`flex-1 md:pb-0 ${PUBLIC_MAIN_BOTTOM_PAD_CLASS}`}
    >
      {children}
    </main>
  );
}
