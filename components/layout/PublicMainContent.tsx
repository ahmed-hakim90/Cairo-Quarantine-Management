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
      className={`flex-1${needsBottomPadding ? " pb-20" : ""}`}
    >
      {children}
    </main>
  );
}
