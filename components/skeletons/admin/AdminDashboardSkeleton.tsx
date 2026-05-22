import {
  SkeletonBlock,
  SkeletonLine,
  SkeletonStatCard,
  SkeletonTable,
} from "@/components/skeletons/primitives";
import {
  AdminDashboardOfficeFilterSkeleton,
  AdminDashboardPeriodFilterSkeleton,
} from "@/components/skeletons/admin/AdminDashboardFilterSkeleton";

export function AdminDashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl" aria-hidden>
      <div className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <SkeletonBlock className="h-8 w-48" />
            <SkeletonLine className="mt-2" width="w-72 max-w-full" />
          </div>
          <div className="flex min-w-0 w-full shrink-0 flex-col gap-4 sm:max-w-xl sm:items-end">
            <AdminDashboardOfficeFilterSkeleton />
          </div>
        </div>
        <AdminDashboardPeriodFilterSkeleton />
      </div>

      <div className="space-y-8 py-6">
        {[0, 1].map((section) => (
          <section key={section} className="space-y-3">
            <SkeletonBlock className="h-5 w-32" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <SkeletonStatCard key={i} />
              ))}
            </div>
          </section>
        ))}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonStatCard />
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm"
          >
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonLine className="mt-2" width="w-full" />
            <SkeletonBlock className="mt-4 h-64 w-full" />
          </div>
        ))}
      </div>

      <section className="mb-6 rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm">
        <SkeletonBlock className="h-5 w-44" />
        <SkeletonLine className="mt-2" width="w-64" />
        <div className="mt-4">
          <SkeletonTable columns={4} rows={4} className="border-0 shadow-none" />
        </div>
      </section>
    </div>
  );
}
