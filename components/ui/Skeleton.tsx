import type { ComponentPropsWithoutRef } from "react";

type SkeletonProps = ComponentPropsWithoutRef<"div"> & {
  /** Decorative pulse block (hidden from accessibility tree). */
  decorative?: boolean;
};

export function Skeleton({
  className = "",
  decorative = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`rounded bg-gov-gray-100 animate-pulse ${className}`.trim()}
      aria-hidden={decorative ? true : undefined}
      {...props}
    />
  );
}

type SkeletonStatusProps = ComponentPropsWithoutRef<"div"> & {
  label?: string;
};

/** Wrapper for meaningful loading regions (forms, panels). */
export function SkeletonStatus({
  className = "",
  label = "جاري التحميل",
  children,
  ...props
}: SkeletonStatusProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
