import { Skeleton } from "@/components/ui/Skeleton";

export function QueuePositionSkeleton() {
  return (
    <div className="mt-3 flex flex-col items-center gap-2" aria-hidden>
      <Skeleton className="h-10 w-24 rounded-md" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}
