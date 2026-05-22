import { LoadingShell } from "@/components/skeletons/LoadingShell";
import { AdminQueueSkeleton } from "@/components/skeletons/admin/AdminQueueSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <AdminQueueSkeleton />
    </LoadingShell>
  );
}
