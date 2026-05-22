import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonLine,
  SkeletonStatCard,
} from "@/components/skeletons/primitives";

export function AdminQueueSkeleton() {
  return (
    <div className="mx-auto max-w-7xl" aria-hidden>
      <SkeletonBlock className="h-8 w-56" />
      <SkeletonLine className="mt-2" width="w-72" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="mt-8">
        <SkeletonBlock className="mb-4 h-10 w-full max-w-md rounded-md" />
        <div className="grid gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} className="flex flex-row items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-4">
                <SkeletonBlock className="h-10 w-10 rounded-full" />
                <div>
                  <SkeletonLine width="w-24" />
                  <SkeletonLine className="mt-1" width="w-32" />
                </div>
              </div>
              <SkeletonBlock className="h-9 w-24 rounded-md" />
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  );
}
