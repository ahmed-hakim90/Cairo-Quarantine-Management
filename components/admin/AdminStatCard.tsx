export function AdminStatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  const valueClass =
    typeof value === "number"
      ? "text-3xl font-extrabold leading-none text-gov-navy"
      : "text-lg font-extrabold leading-snug text-gov-navy sm:text-xl";

  return (
    <div className="rounded-lg border border-gov-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase text-gov-gray-600">{label}</p>
      <p className={`mt-2 line-clamp-3 ${valueClass}`}>{value}</p>
    </div>
  );
}
