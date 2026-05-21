import { AdminStatCard } from "@/components/admin/AdminStatCard";
import type { AdminBookingQueueSection } from "@/lib/office-requests/analytics";

export function AdminBookingQueueStatSection({
  title,
  totalLabel,
  section,
}: {
  title: string;
  totalLabel: string;
  section: AdminBookingQueueSection;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-base font-extrabold text-gov-navy">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label={totalLabel} value={section.totalBookings} />
        <AdminStatCard label="حضر" value={section.checkedIn} />
        <AdminStatCard label="انتهاء فعلي" value={section.completed} />
        <AdminStatCard label="لم يُكمَّل" value={section.notCompleted} />
      </div>
    </section>
  );
}
