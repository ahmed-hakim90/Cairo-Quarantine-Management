import {
  SkeletonBlock,
  SkeletonFormFields,
  SkeletonLine,
} from "@/components/skeletons/primitives";

type CheckinSkeletonProps = {
  compact?: boolean;
};

export function CheckinSkeleton({ compact = false }: CheckinSkeletonProps) {
  const inner = (
    <div className="rounded-lg border border-gov-gray-200 bg-white p-6 shadow-sm">
      <SkeletonBlock className="h-8 w-56" />
      <SkeletonLine className="mt-2" width="w-full max-w-md" />
      <SkeletonFormFields count={3} className="mt-6" />
      <SkeletonBlock className="mt-6 h-11 w-full rounded-md" />
    </div>
  );

  if (compact) {
    return <div aria-hidden>{inner}</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10" aria-hidden>
      {inner}
    </div>
  );
}
