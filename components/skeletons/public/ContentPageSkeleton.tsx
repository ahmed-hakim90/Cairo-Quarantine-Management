import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonLine,
  SkeletonPageHeading,
  SkeletonTable,
} from "@/components/skeletons/primitives";

type ContentPageSkeletonProps = {
  showOfficesTable?: boolean;
  showVaccineSection?: boolean;
};

export function ContentPageSkeleton({
  showOfficesTable = true,
  showVaccineSection = true,
}: ContentPageSkeletonProps) {
  return (
    <>
      <SkeletonPageHeading />
      <div className="mx-auto max-w-6xl px-4 py-10" aria-hidden>
        {showVaccineSection ? (
          <section className="mb-12">
            <SkeletonBlock className="h-8 w-48" />
            <SkeletonBlock className="mt-4 h-10 w-full max-w-sm rounded-md" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <SkeletonCard key={i} className="p-4">
                  <SkeletonLine width="w-3/4" />
                  <SkeletonLine className="mt-2" width="w-1/2" />
                </SkeletonCard>
              ))}
            </div>
          </section>
        ) : null}
        <section className="mb-8">
          <SkeletonBlock className="h-7 w-56" />
          <SkeletonLine className="mt-3" width="w-full max-w-2xl" />
          <div className="mt-6 space-y-4">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i}>
                <SkeletonLine width="w-2/3" />
                <SkeletonLine className="mt-2" />
              </SkeletonCard>
            ))}
          </div>
        </section>
        {showOfficesTable ? (
          <section>
            <SkeletonBlock className="mb-4 h-7 w-44" />
            <SkeletonTable columns={5} rows={4} />
          </section>
        ) : null}
      </div>
    </>
  );
}
