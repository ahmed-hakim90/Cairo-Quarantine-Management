import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonLine,
} from "@/components/skeletons/primitives";

export function BookingPassSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10" aria-hidden>
      <SkeletonCard>
        <SkeletonLine width="w-32" />
        <SkeletonBlock className="mt-3 h-8 w-48" />
        <div className="mt-6 grid gap-3 text-sm">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between gap-4">
              <SkeletonLine width="w-24" />
              <SkeletonLine width="w-32" />
            </div>
          ))}
        </div>
        <SkeletonBlock className="mx-auto mt-8 aspect-square w-48 rounded-lg" />
        <SkeletonLine className="mx-auto mt-4" width="w-40" />
      </SkeletonCard>
    </div>
  );
}
