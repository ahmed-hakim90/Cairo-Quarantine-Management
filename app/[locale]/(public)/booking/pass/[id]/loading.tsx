import { LoadingShell } from "@/components/skeletons/LoadingShell";
import { BookingPassSkeleton } from "@/components/skeletons/public/BookingPassSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <BookingPassSkeleton />
    </LoadingShell>
  );
}
