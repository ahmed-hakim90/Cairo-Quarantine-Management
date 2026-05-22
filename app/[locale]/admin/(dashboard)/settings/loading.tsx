import { LoadingShell } from "@/components/skeletons/LoadingShell";
import { AdminSettingsSkeleton } from "@/components/skeletons/admin/AdminSettingsSkeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <AdminSettingsSkeleton />
    </LoadingShell>
  );
}
