import {
  SkeletonBlock,
  SkeletonButton,
  SkeletonLine,
  SkeletonTable,
} from "@/components/skeletons/primitives";

export function AdminTablePageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl" aria-hidden>
      <div className="flex flex-col gap-4 border-b border-gov-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SkeletonLine width="w-20" />
          <SkeletonBlock className="mt-2 h-8 w-52" />
          <SkeletonLine className="mt-2" width="w-96 max-w-full" />
        </div>
        <SkeletonButton className="h-10 w-28" />
      </div>
      <div className="mt-6">
        <SkeletonTable columns={5} rows={6} />
      </div>
    </div>
  );
}
