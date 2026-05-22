import { LoadingShell } from "@/components/skeletons/LoadingShell";
import { AdminActivitySkeleton } from "@/components/skeletons/admin/AdminActivitySkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <AdminActivitySkeleton />
    </LoadingShell>
  );
}
