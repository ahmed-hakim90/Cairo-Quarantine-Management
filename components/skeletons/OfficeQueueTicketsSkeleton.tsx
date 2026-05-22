import { SkeletonLine } from "@/components/skeletons/primitives";

export function OfficeQueueTicketsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-gov-gray-100" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="grid grid-cols-6 gap-4 px-4 py-3 odd:bg-gov-gray-50/50"
        >
          {[0, 1, 2, 3, 4, 5].map((col) => (
            <SkeletonLine
              key={col}
              width={col === 0 ? "w-8" : "w-16"}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
