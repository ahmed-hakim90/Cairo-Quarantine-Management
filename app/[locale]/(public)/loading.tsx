import { LoadingShell } from "@/components/skeletons/LoadingShell";
import { HomePageSkeleton } from "@/components/skeletons/public/HomePageSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <HomePageSkeleton />
    </LoadingShell>
  );
}
