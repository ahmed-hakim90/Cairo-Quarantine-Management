import { LoadingShell } from "@/components/skeletons/LoadingShell";
import { LandingPageSkeleton } from "@/components/skeletons/public/LandingPageSkeleton";

export default function WelcomeLoading() {
  return (
    <LoadingShell>
      <LandingPageSkeleton />
    </LoadingShell>
  );
}
