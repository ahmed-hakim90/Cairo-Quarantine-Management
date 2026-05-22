import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonLine,
} from "@/components/skeletons/primitives";

export function HomePageSkeleton() {
  return (
    <>
      <section className="overflow-hidden bg-gov-navy-deep" aria-hidden>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-10 pt-14 sm:pt-16 md:pt-20">
          <div className="space-y-6">
            <SkeletonBlock className="h-10 w-full max-w-lg bg-white/20 sm:h-12" />
            <SkeletonBlock className="h-4 w-full max-w-2xl bg-white/15" />
            <SkeletonBlock className="h-4 w-4/5 max-w-xl bg-white/15" />
          </div>
          <SkeletonBlock className="aspect-[16/7] w-full max-w-3xl rounded-lg bg-white/10" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" aria-hidden>
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonLine className="mt-2" width="w-96 max-w-full" />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <SkeletonCard className="min-h-[180px]">
                <SkeletonBlock className="h-12 w-12 rounded-md" />
                <SkeletonBlock className="mt-4 h-6 w-3/4" />
                <SkeletonLine className="mt-3" />
                <SkeletonLine className="mt-2" width="w-2/3" />
              </SkeletonCard>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10" aria-hidden>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="p-4">
              <SkeletonBlock className="h-10 w-10 rounded-full" />
              <SkeletonLine className="mt-3" width="w-3/4" />
            </SkeletonCard>
          ))}
        </div>
      </section>

      <section className="border-y border-gov-gray-200 bg-gov-gray-50 py-14" aria-hidden>
        <div className="mx-auto max-w-6xl px-4">
          <SkeletonBlock className="h-8 w-56" />
          <SkeletonBlock className="mt-6 h-10 w-full max-w-md rounded-md" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} className="p-4">
                <SkeletonLine width="w-2/3" />
                <SkeletonLine className="mt-2" width="w-1/2" />
              </SkeletonCard>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" aria-hidden>
        <SkeletonBlock className="h-7 w-40" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 pb-16" aria-hidden>
        <SkeletonBlock className="h-8 w-52" />
        <SkeletonBlock className="mt-6 h-48 w-full rounded-lg" />
      </section>
    </>
  );
}
