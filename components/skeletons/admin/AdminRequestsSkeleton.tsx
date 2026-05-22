import {
  SkeletonBlock,
  SkeletonButton,
  SkeletonLine,
  SkeletonTable,
} from "@/components/skeletons/primitives";

export function AdminRequestsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl" aria-hidden>
      <div className="flex flex-col gap-4 border-b border-gov-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SkeletonBlock className="h-8 w-40" />
          <SkeletonLine className="mt-2" width="w-64" />
        </div>
        <SkeletonButton className="h-10 w-32" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[0, 1, 2].map((i) => (
          <SkeletonButton key={i} className="h-9 w-24" />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-9 w-28 rounded-md" />
        ))}
      </div>

      <div className="mt-6">
        <SkeletonTable columns={6} rows={8} />
      </div>
    </div>
  );
}
