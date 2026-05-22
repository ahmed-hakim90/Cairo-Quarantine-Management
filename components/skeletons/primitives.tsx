import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function SkeletonLine({
  className = "",
  width = "w-full",
}: {
  className?: string;
  width?: string;
}) {
  return <Skeleton className={`h-3 ${width} ${className}`.trim()} />;
}

export function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return <Skeleton className={className} />;
}

export function SkeletonCard({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm ${className}`.trim()}
      aria-hidden
    >
      {children}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <SkeletonCard className="p-4">
      <SkeletonLine width="w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
    </SkeletonCard>
  );
}

export function SkeletonPageHeading() {
  return (
    <header className="border-b border-gov-gray-200 bg-gov-gray-50 py-12" aria-hidden>
      <div className="mx-auto max-w-6xl px-4">
        <Skeleton className="h-9 w-64 max-w-full md:h-10" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
        <Skeleton className="mt-2 h-5 w-3/4 max-w-xl" />
      </div>
    </header>
  );
}

export function SkeletonFormFields({
  count = 6,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-5 ${className}`.trim()} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <SkeletonLine width="w-32" />
          <Skeleton className="mt-2 h-10 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({
  columns = 4,
  rows = 5,
  className = "",
}: {
  columns?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={`overflow-x-auto rounded-lg border border-gov-gray-200 bg-white shadow-sm ${className}`.trim()}
      aria-hidden
    >
      <table className="min-w-full text-right text-sm">
        <thead className="bg-gov-gray-50">
          <tr>
            {Array.from({ length: columns }, (_, i) => (
              <th key={i} className="px-4 py-3">
                <SkeletonLine width="w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gov-gray-100">
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }, (_, col) => (
                <td key={col} className="px-4 py-3">
                  <SkeletonLine width={col === 0 ? "w-28" : "w-12"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonButton({
  className = "h-10 w-28",
}: {
  className?: string;
}) {
  return <Skeleton className={`rounded-md ${className}`.trim()} />;
}
