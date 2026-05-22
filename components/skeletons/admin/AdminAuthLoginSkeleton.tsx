import { LoadingShell } from "@/components/skeletons/LoadingShell";
import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonFormFields,
  SkeletonLine,
} from "@/components/skeletons/primitives";

export function AdminAuthLoginSkeleton() {
  return (
    <LoadingShell className="flex min-h-screen flex-col bg-gov-gray-50">
      <div
        className="border-b border-gov-gray-200 bg-gov-navy px-4 py-3 sm:px-6"
        aria-hidden
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine width="w-40" className="bg-white/20" />
            <SkeletonBlock className="h-5 w-56 max-w-full bg-white/30" />
          </div>
          <SkeletonBlock className="h-9 w-20 rounded-md bg-white/20" />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <SkeletonCard className="w-full max-w-md md:p-7">
          <div className="mb-6 flex flex-col items-center gap-3">
            <SkeletonBlock className="size-16 rounded-full" />
            <SkeletonBlock className="h-7 w-48" />
            <SkeletonLine width="w-full" />
            <SkeletonLine width="w-4/5" />
          </div>
          <SkeletonFormFields count={2} />
          <SkeletonBlock className="mt-5 h-11 w-full rounded-md" />
          <SkeletonLine width="w-40" className="mx-auto mt-6" />
        </SkeletonCard>
      </div>
    </LoadingShell>
  );
}
