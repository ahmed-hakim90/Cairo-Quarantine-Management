import { LoadingShell } from "@/components/skeletons/LoadingShell";
import { AdminRequestsSkeleton } from "@/components/skeletons/admin/AdminRequestsSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <AdminRequestsSkeleton />
    </LoadingShell>
  );
}
