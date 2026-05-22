import {
  SkeletonBlock,
  SkeletonButton,
  SkeletonCard,
  SkeletonLine,
} from "@/components/skeletons/primitives";

type MyRequestsSkeletonProps = {
  cardCount?: number;
  compact?: boolean;
};

export function MyRequestsSkeleton({
  cardCount = 3,
  compact = false,
}: MyRequestsSkeletonProps) {
  return (
    <div
      className={
        compact
          ? "grid gap-4"
          : "mx-auto max-w-6xl px-4 py-8 lg:py-12"
      }
      aria-hidden
    >
      {!compact ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SkeletonBlock className="h-9 w-48" />
            <SkeletonLine className="mt-2" width="w-96 max-w-full" />
          </div>
          <SkeletonButton className="h-11 w-32" />
        </div>
      ) : null}
      <div className="grid gap-4">
        {Array.from({ length: cardCount }, (_, i) => (
          <SkeletonCard key={i}>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div>
                <SkeletonLine width="w-20" />
                <SkeletonBlock className="mt-2 h-7 w-36" />
                <SkeletonLine className="mt-2" width="w-48" />
              </div>
              <SkeletonBlock className="h-9 w-24 rounded-md" />
            </div>
            <div className="mt-5 grid gap-4 border-t border-gov-gray-200 pt-4 md:grid-cols-3">
              {[0, 1, 2].map((j) => (
                <div key={j}>
                  <SkeletonLine width="w-24" />
                  <SkeletonLine className="mt-2" width="w-32" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
