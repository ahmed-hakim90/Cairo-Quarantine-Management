import { LoadingShell } from "@/components/skeletons/LoadingShell";
import { AdminDetailSkeleton } from "@/components/skeletons/admin/AdminDetailSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <AdminDetailSkeleton />
    </LoadingShell>
  );
}
