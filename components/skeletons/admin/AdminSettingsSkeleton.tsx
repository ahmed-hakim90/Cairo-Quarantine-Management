import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonFormFields,
  SkeletonLine,
} from "@/components/skeletons/primitives";

export function AdminSettingsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8" aria-hidden>
      <div>
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonLine className="mt-2" width="w-80 max-w-full" />
      </div>
      {[0, 1, 2].map((i) => (
        <SkeletonCard key={i}>
          <SkeletonBlock className="h-6 w-48" />
          <SkeletonLine className="mt-2" width="w-full max-w-lg" />
          <SkeletonFormFields count={4} className="mt-6" />
        </SkeletonCard>
      ))}
    </div>
  );
}
