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
  q?: string | null;
  status?: AdminRequestsStatusFilter;
  sort?: AdminRequestsSort;
  range?: string;
  from?: string;
  to?: string;
  /** @deprecated Use page + cursors */
  cursor?: string | null;
  page?: number | null;
  cursors?: string[] | null;
};

export function parseAdminRequestsPage(raw?: string | null): number {
  const value = raw?.trim();
  if (!value) return 1;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function parseAdminRequestsCursors(raw?: string | null): string[] {
  const value = raw?.trim();
  if (!value) return [];
  return value.split(",").map((c) => c.trim()).filter(Boolean);
}

/** Cursor for Firestore list at 1-based page number. */
export function cursorForAdminRequestsPage(
  page: number,
  cursors: string[],
): string | undefined {
  if (page <= 1) return undefined;
  return cursors[page - 2];
}

export function buildAdminRequestsHref(
  base: string,
  params: AdminRequestsHrefParams,
): string {
  const search = new URLSearchParams();
  const q = params.q?.trim();
  if (q) search.set("q", q);
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
  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }
  const cursors = params.cursors?.filter(Boolean) ?? [];
  if (cursors.length > 0) {
    search.set("cursors", cursors.join(","));
  }
  if (params.cursor && cursors.length === 0) {
    search.set("cursor", params.cursor);
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}
