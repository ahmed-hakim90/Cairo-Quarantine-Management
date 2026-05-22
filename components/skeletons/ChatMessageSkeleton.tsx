import { Skeleton } from "@/components/ui/Skeleton";

export function ChatMessageSkeleton() {
  return (
    <div
      className="max-w-[85%] self-start rounded-2xl rounded-es-sm bg-white px-4 py-3 shadow-sm"
      aria-hidden
    >
      <Skeleton className="mb-2 h-3 w-48" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}
