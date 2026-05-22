import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonLine,
} from "@/components/skeletons/primitives";

export function AdminDetailSkeleton() {
  return (
    <div
      className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_320px]"
      aria-hidden
    >
      <div className="space-y-6">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonCard>
          <SkeletonLine width="w-32" />
          <SkeletonBlock className="mt-3 h-6 w-64" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <SkeletonLine width="w-24" />
                <SkeletonLine className="mt-2" width="w-40" />
              </div>
            ))}
          </div>
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonBlock className="h-5 w-36" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <SkeletonLine key={i} width="w-full" />
            ))}
          </div>
        </SkeletonCard>
      </div>
      <aside className="space-y-4">
        <SkeletonCard>
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="mt-4 h-10 w-full rounded-md" />
          <SkeletonBlock className="mt-2 h-10 w-full rounded-md" />
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonLine className="mt-4" />
          <SkeletonLine className="mt-2" />
        </SkeletonCard>
      </aside>
    </div>
  );
}
