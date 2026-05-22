"use client";

import { usePathname } from "next/navigation";

const footerHiddenSegments = new Set(["booking", "complaint", "checkin"]);

type PublicMainContentProps = {
  children: React.ReactNode;
};

export function PublicMainContent({ children }: PublicMainContentProps) {
  const pathname = usePathname();
  const [, , pageSegment] = pathname.split("/");
  const needsBottomPadding = footerHiddenSegments.has(pageSegment);

  return (
    <main
      id="main-content"
      className={
        needsBottomPadding
          ? "flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]"
          : "flex-1"
      }
    >
      {children}
    </main>
  );
}
