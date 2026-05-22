import { LoadingShell } from "@/components/skeletons/LoadingShell";
import { AdminTablePageSkeleton } from "@/components/skeletons/admin/AdminTablePageSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <AdminTablePageSkeleton />
    </LoadingShell>
  );
}
