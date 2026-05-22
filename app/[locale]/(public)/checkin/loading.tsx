import { LoadingShell } from "@/components/skeletons/LoadingShell";
import { CheckinSkeleton } from "@/components/skeletons/public/CheckinSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <CheckinSkeleton />
    </LoadingShell>
  );
}
