import { AdminStatCard } from "@/components/admin/AdminStatCard";
import type { AdminFeedbackSection } from "@/lib/office-requests/analytics";

export function AdminFeedbackStatSection({
  title,
  totalLabel,
  section,
}: {
  title: string;
  totalLabel: string;
  section: AdminFeedbackSection;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-base font-extrabold text-gov-navy">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminStatCard label={totalLabel} value={section.total} />
        <AdminStatCard label="جديد" value={section.newCount} />
      </div>
    </section>
  );
}
