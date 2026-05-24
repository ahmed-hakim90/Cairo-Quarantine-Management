"use client";

import { useMemo, useState } from "react";
import {
  sortOfficePerformanceRatingsBy,
  type OfficePerformanceRating,
  type OfficePerformanceSortDirection,
  type OfficePerformanceSortKey,
} from "@/lib/office-requests/analytics";

type AdminOfficePerformanceTableProps = {
  ratings: OfficePerformanceRating[];
  showComplaints?: boolean;
};

function defaultDirectionForKey(
  key: OfficePerformanceSortKey,
): OfficePerformanceSortDirection {
  return key === "officeNameAr" ? "asc" : "desc";
}

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: OfficePerformanceSortDirection;
}) {
  if (!active) {
    return (
      <span className="text-gov-gray-400" aria-hidden="true">
        ↕
      </span>
    );
  }

  return (
    <span className="text-gov-navy" aria-hidden="true">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = "start",
}: {
  label: string;
  sortKey: OfficePerformanceSortKey;
  activeKey: OfficePerformanceSortKey;
  direction: OfficePerformanceSortDirection;
  onSort: (key: OfficePerformanceSortKey) => void;
  align?: "start" | "center";
}) {
  const active = activeKey === sortKey;

  return (
    <th
      className={`px-4 py-3 ${align === "center" ? "text-center" : "text-start"}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 font-bold uppercase text-gov-gray-600 transition-colors hover:text-gov-navy ${
          align === "center" ? "mx-auto" : ""
        }`}
        aria-sort={
          active
            ? direction === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
      >
        <span>{label}</span>
        <SortIndicator active={active} direction={direction} />
      </button>
    </th>
  );
}

export function AdminOfficePerformanceTable({
  ratings,
  showComplaints = true,
}: AdminOfficePerformanceTableProps) {
  const [sortKey, setSortKey] =
    useState<OfficePerformanceSortKey>("bookings");
  const [sortDirection, setSortDirection] =
    useState<OfficePerformanceSortDirection>("desc");

  const sortedRatings = useMemo(
    () => sortOfficePerformanceRatingsBy(ratings, sortKey, sortDirection),
    [ratings, sortKey, sortDirection],
  );

  function handleSort(key: OfficePerformanceSortKey) {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(defaultDirectionForKey(key));
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-right text-sm">
        <thead className="bg-gov-gray-50 text-xs">
          <tr>
            <SortableHeader
              label="المكتب"
              sortKey="officeNameAr"
              activeKey={sortKey}
              direction={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              label="حجوزات"
              sortKey="bookings"
              activeKey={sortKey}
              direction={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              label="مكتمل"
              sortKey="completed"
              activeKey={sortKey}
              direction={sortDirection}
              onSort={handleSort}
            />
            {showComplaints ? (
              <SortableHeader
                label="شكاوى"
                sortKey="complaints"
                activeKey={sortKey}
                direction={sortDirection}
                onSort={handleSort}
              />
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-gov-gray-100">
          {sortedRatings.map((rating) => (
            <tr key={rating.officeId} className="align-middle">
              <td className="px-4 py-3 font-bold text-gov-navy">
                {rating.officeNameAr}
              </td>
              <td className="px-4 py-3 font-semibold text-gov-gray-800">
                {rating.bookings}
              </td>
              <td className="px-4 py-3 font-semibold text-gov-gray-800">
                {rating.completed}
              </td>
              {showComplaints ? (
                <td className="px-4 py-3 font-semibold text-gov-gray-800">
                  {rating.complaints}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}