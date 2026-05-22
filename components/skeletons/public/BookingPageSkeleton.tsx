import {
  SkeletonBlock,
  SkeletonButton,
  SkeletonFormFields,
  SkeletonLine,
} from "@/components/skeletons/primitives";

export function BookingPageSkeleton() {
  return (
    <section className="bg-gov-gray-50" aria-hidden>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:gap-8 sm:py-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-8 lg:py-12">
        <aside className="order-2 self-start lg:order-none">
          <SkeletonLine width="w-24" />
          <SkeletonBlock className="mt-3 h-10 w-full max-w-sm" />
          <SkeletonLine className="mt-4" width="w-full" />
          <SkeletonLine className="mt-2" width="w-5/6" />
          <dl className="mt-6 grid grid-cols-2 gap-3 max-sm:mt-4 lg:grid-cols-1">
            <div className="rounded-md border border-gov-gray-200 bg-white p-4">
              <SkeletonLine width="w-28" />
              <SkeletonBlock className="mt-2 h-8 w-12" />
            </div>
            <div className="rounded-md border border-gov-gray-200 bg-white p-4">
              <SkeletonLine width="w-32" />
              <SkeletonLine className="mt-2" />
            </div>
          </dl>
        </aside>
        <div className="order-1 space-y-4 lg:order-none">
          <div className="flex gap-2">
            <SkeletonButton className="h-14 flex-1 sm:h-10" />
            <SkeletonButton className="h-14 flex-1 sm:h-10" />
          </div>
          <div className="rounded-lg border border-gov-gray-200 bg-white shadow-sm max-sm:-mx-4 max-sm:rounded-none max-sm:border-x-0">
            <div className="p-5 md:p-6">
              <SkeletonFormFields count={8} />
            </div>
            <div className="border-t border-gov-gray-200 bg-gov-gray-50 px-5 py-4">
              <SkeletonButton className="h-12 w-full sm:h-11 sm:w-40" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
