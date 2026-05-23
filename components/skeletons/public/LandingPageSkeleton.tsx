import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonLine,
} from "@/components/skeletons/primitives";

export function LandingPageSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-landing-bg px-4 py-8" aria-hidden>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
        <div className="space-y-4 pt-16">
          <SkeletonBlock className="h-14 w-14 rounded-2xl" />
          <SkeletonBlock className="h-10 w-full max-w-md" />
          <SkeletonLine className="max-w-lg" />
          <SkeletonLine width="w-4/5" />
          <div className="flex gap-3 pt-2">
            <SkeletonBlock className="h-12 w-32 rounded-xl" />
            <SkeletonBlock className="h-12 w-28 rounded-xl" />
          </div>
        </div>
        <SkeletonBlock className="aspect-square w-full max-w-lg rounded-2xl justify-self-end" />
      </div>

      <section className="mx-auto mt-20 max-w-6xl">
        <SkeletonBlock className="mx-auto h-8 w-48" />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i}>
              <SkeletonCard className="min-h-[160px]" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
