import { LoadingShell } from "@/components/skeletons/LoadingShell";
import { AdminDashboardSkeleton } from "@/components/skeletons/admin/AdminDashboardSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <AdminDashboardSkeleton />
    </LoadingShell>
  );
}
