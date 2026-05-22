import { LoadingShell } from "@/components/skeletons/LoadingShell";
import { MyRequestsSkeleton } from "@/components/skeletons/public/MyRequestsSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <MyRequestsSkeleton />
    </LoadingShell>
  );
}
