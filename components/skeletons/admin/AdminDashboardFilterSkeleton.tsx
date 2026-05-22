import { Skeleton } from "@/components/ui/Skeleton";

/** Matches SuperAdminDashboardOfficeFilter Suspense fallback. */
export function AdminDashboardOfficeFilterSkeleton() {
  return (
    <div
      className="flex min-w-0 w-full max-w-full flex-col gap-1"
      aria-hidden
    >
      <Skeleton className="h-3 w-28 max-w-full" />
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Skeleton className="h-10 min-w-0 flex-1 rounded-md" />
        <Skeleton className="h-10 w-[7.5rem] shrink-0 rounded-md" />
      </div>
    </div>
  );
}

/** Matches AdminDashboardPeriodFilter Suspense fallback. */
export function AdminDashboardPeriodFilterSkeleton() {
  return (
    <div className="mt-4 border-t border-gov-gray-100 pt-4" aria-hidden>
      <Skeleton className="mb-2 h-3 w-40" />
      <Skeleton className="h-10 w-full max-w-md rounded-md" />
    </div>
  );
}
