import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonLine,
} from "@/components/skeletons/primitives";

export function AdminActivitySkeleton() {
  return (
    <div className="mx-auto max-w-7xl" aria-hidden>
      <SkeletonBlock className="h-8 w-44" />
      <SkeletonLine className="mt-2" width="w-64" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <SkeletonCard key={i} className="p-4">
            <div className="flex gap-4">
              <SkeletonBlock className="h-3 w-3 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <SkeletonLine width="w-3/4" />
                <SkeletonLine className="mt-2" width="w-1/2" />
              </div>
              <SkeletonLine width="w-20" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
