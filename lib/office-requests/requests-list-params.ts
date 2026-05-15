import type { OfficeRequestStatus } from "@/lib/office-requests/types";

export type AdminRequestsStatusFilter = "all" | OfficeRequestStatus;

export type AdminRequestsSort =
  | "created_desc"
  | "created_asc"
  | "updated_desc"
  | "updated_asc";

const REQUEST_STATUSES = new Set<OfficeRequestStatus>([
  "new",
  "in_progress",
  "contacted",
  "completed",
  "cancelled",
]);

const REQUEST_SORTS = new Set<AdminRequestsSort>([
  "created_desc",
  "created_asc",
  "updated_desc",
  "updated_asc",
]);

export function parseAdminRequestsStatus(
  raw?: string | null,
): AdminRequestsStatusFilter {
  const value = raw?.trim();
  if (!value || value === "all") return "all";
  if (REQUEST_STATUSES.has(value as OfficeRequestStatus)) {
    return value as OfficeRequestStatus;
  }
  return "all";
}

export function parseAdminRequestsSort(raw?: string | null): AdminRequestsSort {
  const value = raw?.trim();
  if (value && REQUEST_SORTS.has(value as AdminRequestsSort)) {
    return value as AdminRequestsSort;
  }
  return "created_desc";
}

export function sortToFirestore(sort: AdminRequestsSort): {
  sortKey: "createdAt" | "updatedAt";
  sortDirection: "asc" | "desc";
} {
  switch (sort) {
    case "created_asc":
      return { sortKey: "createdAt", sortDirection: "asc" };
    case "updated_desc":
      return { sortKey: "updatedAt", sortDirection: "desc" };
    case "updated_asc":
      return { sortKey: "updatedAt", sortDirection: "asc" };
    case "created_desc":
    default:
      return { sortKey: "createdAt", sortDirection: "desc" };
  }
}

/** Firestore cannot orderBy(createdAt) when filtering on an updatedAt range. */
export function coerceSortForUpdatedWindow(
  sort: AdminRequestsSort,
  hasUpdatedWindow: boolean,
): AdminRequestsSort {
  if (!hasUpdatedWindow) return sort;
  switch (sort) {
    case "created_asc":
      return "updated_asc";
    case "created_desc":
      return "updated_desc";
    default:
      return sort;
  }
}

export type AdminRequestsHrefParams = {
  status?: AdminRequestsStatusFilter;
  sort?: AdminRequestsSort;
  range?: string;
  from?: string;
  to?: string;
  cursor?: string | null;
};

export function buildAdminRequestsHref(
  base: string,
  params: AdminRequestsHrefParams,
): string {
  const search = new URLSearchParams();
  if (params.status && params.status !== "all") {
    search.set("status", params.status);
  }
  if (params.sort && params.sort !== "created_desc") {
    search.set("sort", params.sort);
  }
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.range && params.range !== "all") {
    search.set("range", params.range);
  }
  if (params.cursor) search.set("cursor", params.cursor);
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}
