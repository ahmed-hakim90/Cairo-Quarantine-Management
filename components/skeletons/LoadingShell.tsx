import type { ReactNode } from "react";
import { SkeletonStatus } from "@/components/ui/Skeleton";

type LoadingShellProps = {
  children: ReactNode;
  label?: string;
  className?: string;
};

export function LoadingShell({
  children,
  label = "جاري التحميل",
  className = "",
}: LoadingShellProps) {
  return (
    <SkeletonStatus
      className={`pointer-events-none ${className}`.trim()}
      label={label}
    >
      {children}
    </SkeletonStatus>
  );
}
