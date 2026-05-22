import { LoadingShell } from "@/components/skeletons/LoadingShell";
import { ContentPageSkeleton } from "@/components/skeletons/public/ContentPageSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <ContentPageSkeleton />
    </LoadingShell>
  );
}
