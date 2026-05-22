import { LoadingShell } from "@/components/skeletons/LoadingShell";
import { BookingPageSkeleton } from "@/components/skeletons/public/BookingPageSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <BookingPageSkeleton />
    </LoadingShell>
  );
}
