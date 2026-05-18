import {
  getAdminApiSecret,
  getVpsApiBaseUrl,
  isVpsApiEnabled,
} from "@/lib/api/vps-config";
import type {
  AdminRole,
  AdminActivityLogEntry,
  CreatedOfficeRequestPublic,
  OfficeRequest,
  OfficeRequestStatus,
  OfficeRequestType,
  PaginatedResult,
} from "@/lib/office-requests/types";
import type { QueueTicket } from "@/lib/queue/types";
import type { QueuePositionPublic } from "@/lib/queue/queue-position";

export { isVpsApiEnabled } from "@/lib/api/vps-config";

export type VpsAdminScope = {
  role: AdminRole;
  officeId: string | null;
  allowedOfficeIds?: string[];
};

export type BookingAvailabilityResult = {
  available: boolean;
  count: number;
  cap: number | null;
  fullMessage?: string;
};

export class VpsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "VpsApiError";
  }
}

type ApiErrorBody = {
  error?: string;
  message?: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

async function vpsFetch<T>(
  path: string,
  init?: RequestInit & { admin?: boolean },
): Promise<T> {
  const base = getVpsApiBaseUrl();
  if (!base) {
    throw new VpsApiError("VPS API URL is not configured", 503, "not_configured");
  }

  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init?.admin) {
    const secret = getAdminApiSecret();
    if (!secret) {
      throw new VpsApiError(
        "ADMIN_API_SECRET is not configured",
        503,
        "admin_not_configured",
      );
    }
    headers.set("Authorization", `Bearer ${secret}`);
  }

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const body = await parseJson<T & ApiErrorBody>(res);
  if (!res.ok) {
    throw new VpsApiError(
      body.message ?? body.error ?? `VPS API error (${res.status})`,
      res.status,
      body.error,
    );
  }
  return body as T;
}

function scopeSearchParams(scope: VpsAdminScope): URLSearchParams {
  const params = new URLSearchParams();
  params.set("role", scope.role);
  if (scope.officeId) params.set("sessionOfficeId", scope.officeId);
  if (scope.allowedOfficeIds?.length) {
    params.set("allowedOfficeIds", scope.allowedOfficeIds.join(","));
  }
  return params;
}

export async function vpsGetBookingAvailability(args: {
  officeId: string;
  preferredDate: string;
}): Promise<BookingAvailabilityResult> {
  const params = new URLSearchParams({
    officeId: args.officeId,
    preferredDate: args.preferredDate,
  });
  return vpsFetch(`/v1/booking-availability?${params}`);
}

export async function vpsCreateRequest(input: {
  governorateId: string;
  officeId: string;
  type: OfficeRequestType;
  travelerStateId?: string;
  preferredDate?: string;
  name: string;
  phone: string;
  details: string;
  hasSpecialNeeds?: boolean;
  hasElderly?: boolean;
}): Promise<CreatedOfficeRequestPublic> {
  return vpsFetch("/v1/requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type VpsCheckinResult =
  | {
      ok: true;
      ticket: QueueTicket;
      citizenName?: string;
      passToken?: string;
      requestType?: OfficeRequest["type"];
      requestId?: string;
      officeNameAr?: string;
      preferredDate?: string;
      initialPosition?: QueuePositionPublic;
    }
  | {
      ok: false;
      error: string;
      needsQuickForm?: boolean;
      lookupValue?: string;
    };

export async function vpsCheckin(
  body: Record<string, unknown>,
): Promise<VpsCheckinResult> {
  return vpsFetch("/v1/checkin", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type VpsAdminListParams = {
  scope: VpsAdminScope;
  status?: OfficeRequestStatus | "all";
  type?: OfficeRequestType | "all";
  officeFilter?: string;
  limit?: number;
  cursor?: string | null;
  q?: string;
  sort?: string;
  updatedFrom?: string;
  updatedTo?: string;
  adminBookingTodayYmd?: string | null;
  bookingDateFrom?: string | null;
  bookingDateTo?: string | null;
};

function applyAdminListParams(
  params: URLSearchParams,
  args: VpsAdminListParams,
): void {
  if (args.status && args.status !== "all") params.set("status", args.status);
  if (args.type && args.type !== "all") params.set("type", args.type);
  if (args.officeFilter) params.set("officeFilter", args.officeFilter);
  if (args.limit) params.set("limit", String(args.limit));
  if (args.cursor) params.set("cursor", args.cursor);
  if (args.q) params.set("q", args.q);
  if (args.sort) params.set("sort", args.sort);
  if (args.updatedFrom) params.set("updatedFrom", args.updatedFrom);
  if (args.updatedTo) params.set("updatedTo", args.updatedTo);
  if (args.adminBookingTodayYmd) {
    params.set("adminBookingTodayYmd", args.adminBookingTodayYmd);
  }
  if (args.bookingDateFrom) params.set("bookingDateFrom", args.bookingDateFrom);
  if (args.bookingDateTo) params.set("bookingDateTo", args.bookingDateTo);
}

export async function vpsListAdminRequests(
  args: VpsAdminListParams,
): Promise<PaginatedResult<OfficeRequest>> {
  const params = scopeSearchParams(args.scope);
  applyAdminListParams(params, args);
  return vpsFetch(`/v1/admin/requests?${params}`, { admin: true });
}

export type VpsAddRequestToQueueResult = {
  ok: true;
  requestId: string;
  ticketId: string;
  officeId: string;
  requestNumber: string;
  citizenName: string;
  queueNumber: number;
  aheadCount: number;
  alreadyInQueue: boolean;
  message: string;
};

export async function vpsAddRequestToQueue(args: {
  scope: VpsAdminScope;
  requestId: string;
}): Promise<VpsAddRequestToQueueResult> {
  return vpsFetch("/v1/admin/queue/from-request", {
    method: "POST",
    admin: true,
    body: JSON.stringify({
      requestId: args.requestId,
      scope: {
        role: args.scope.role,
        sessionOfficeId: args.scope.officeId ?? "",
        allowedOfficeIds: args.scope.allowedOfficeIds?.join(",") ?? "",
      },
    }),
  });
}

export async function vpsUpdateAdminRequest(args: {
  scope: VpsAdminScope;
  id: string;
  status: OfficeRequestStatus;
  notes: string;
  actorUid: string;
  actorLabel: string;
}): Promise<OfficeRequest> {
  return vpsFetch(`/v1/admin/requests/${encodeURIComponent(args.id)}`, {
    method: "PATCH",
    admin: true,
    body: JSON.stringify({
      status: args.status,
      notes: args.notes,
      actorUid: args.actorUid,
      actorLabel: args.actorLabel,
      scope: {
        role: args.scope.role,
        sessionOfficeId: args.scope.officeId ?? "",
        allowedOfficeIds: args.scope.allowedOfficeIds?.join(",") ?? "",
      },
    }),
  });
}

export async function vpsCompleteQueueTicket(
  ticketId: string,
): Promise<QueueTicket> {
  return vpsFetch(
    `/v1/admin/queue/tickets/${encodeURIComponent(ticketId)}/complete`,
    { method: "POST", admin: true },
  );
}

export async function vpsGetQueueTicketState(
  ticketId: string,
): Promise<QueuePositionPublic> {
  return vpsFetch(`/v1/queue/tickets/${encodeURIComponent(ticketId)}/state`);
}

export function firestoreSortToVpsSort(args: {
  sortKey?: "createdAt" | "updatedAt";
  sortDirection?: "asc" | "desc";
}): string | undefined {
  const dir = args.sortDirection === "asc" ? "asc" : "desc";
  if (args.sortKey === "updatedAt") {
    return dir === "asc" ? "updated_asc" : "updated_desc";
  }
  if (args.sortKey === "createdAt" || args.sortDirection) {
    return dir === "asc" ? "created_asc" : "created_desc";
  }
  return undefined;
}

function timestampToIso(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const date = (value as { toDate: () => Date }).toDate();
    return date.toISOString();
  }
  return undefined;
}

export async function vpsListRequestsForSessionPage(args: {
  role: AdminRole;
  officeId: string | null;
  allowedOfficeIds?: string[];
  status?: OfficeRequestStatus | "all";
  type?: OfficeRequestType | "all";
  officeFilter?: string;
  cursor?: string | null;
  pageSize?: number;
  sortKey?: "createdAt" | "updatedAt";
  sortDirection?: "asc" | "desc";
  updatedFrom?: unknown;
  updatedTo?: unknown;
  bookingDateFrom?: string | null;
  bookingDateTo?: string | null;
  adminBookingTodayYmd?: string | null;
}): Promise<PaginatedResult<OfficeRequest> | null> {
  if (!isVpsApiEnabled()) return null;
  return vpsListAdminRequests({
    scope: {
      role: args.role,
      officeId: args.officeId,
      allowedOfficeIds: args.allowedOfficeIds,
    },
    status: args.status,
    type: args.type,
    officeFilter: args.officeFilter,
    limit: args.pageSize,
    cursor: args.cursor,
    sort: firestoreSortToVpsSort(args),
    updatedFrom: timestampToIso(args.updatedFrom),
    updatedTo: timestampToIso(args.updatedTo),
    adminBookingTodayYmd: args.adminBookingTodayYmd,
    bookingDateFrom: args.bookingDateFrom,
    bookingDateTo: args.bookingDateTo,
  });
}

export type VpsActivityLogsParams = {
  scope: VpsAdminScope;
  limit?: number;
  cursor?: string | null;
  createdFrom?: string;
  createdTo?: string;
  officeFilter?: string | null;
  actorUid?: string | null;
  requestId?: string | null;
};

export async function vpsListActivityLogs(
  args: VpsActivityLogsParams,
): Promise<PaginatedResult<AdminActivityLogEntry>> {
  const params = scopeSearchParams(args.scope);
  if (args.limit) params.set("limit", String(args.limit));
  if (args.cursor) params.set("cursor", args.cursor);
  if (args.createdFrom) params.set("createdFrom", args.createdFrom);
  if (args.createdTo) params.set("createdTo", args.createdTo);
  if (args.officeFilter) params.set("officeFilter", args.officeFilter);
  if (args.actorUid) params.set("actorUid", args.actorUid);
  if (args.requestId) params.set("requestId", args.requestId);
  return vpsFetch(`/v1/admin/activity-logs?${params}`, { admin: true });
}

export async function vpsListLatestActivityLogsByRequestIds(
  requestIds: string[],
): Promise<Record<string, AdminActivityLogEntry>> {
  if (requestIds.length === 0) return {};
  const params = new URLSearchParams();
  params.set("requestIds", requestIds.join(","));
  return vpsFetch(`/v1/admin/activity-logs?${params}`, { admin: true });
}

export type VpsExportRequestsParams = {
  scope: VpsAdminScope;
  types?: OfficeRequestType[];
  officeId?: string | null;
  officeIds?: string[] | null;
  travelerStateIds?: string[];
  travelerCategories?: string[];
  includeUncategorizedBookings?: boolean;
  createdFrom?: string;
  createdTo?: string;
  adminBookingTodayYmd?: string;
};

export async function vpsExportAdminRequests(
  args: VpsExportRequestsParams,
): Promise<{ requests: OfficeRequest[]; capped: boolean }> {
  const params = scopeSearchParams(args.scope);
  if (args.types?.length) params.set("types", args.types.join(","));
  if (args.officeId) params.set("officeId", args.officeId);
  if (args.officeIds?.length) params.set("officeIds", args.officeIds.join(","));
  if (args.travelerStateIds?.length) {
    params.set("travelerStateIds", args.travelerStateIds.join(","));
  }
  if (args.travelerCategories?.length) {
    params.set("travelerCategories", args.travelerCategories.join(","));
  }
  if (args.includeUncategorizedBookings) {
    params.set("includeUncategorized", "true");
  }
  if (args.createdFrom) params.set("createdFrom", args.createdFrom);
  if (args.createdTo) params.set("createdTo", args.createdTo);
  if (args.adminBookingTodayYmd) {
    params.set("adminBookingTodayYmd", args.adminBookingTodayYmd);
  }
  return vpsFetch(`/v1/admin/export/requests?${params}`, { admin: true });
}

export async function vpsRegisterQueueWatch(args: {
  ticketId: string;
  fcmToken: string;
}): Promise<void> {
  await vpsFetch("/v1/queue/watch", {
    method: "POST",
    body: JSON.stringify(args),
  });
}

export async function vpsDeleteQueueWatch(ticketId: string): Promise<void> {
  const params = new URLSearchParams({ ticketId });
  await vpsFetch(`/v1/queue/watch?${params}`, { method: "DELETE" });
}

export async function vpsSearchRequestsForSessionPage(args: {
  q: string;
  role: AdminRole;
  officeId: string | null;
  allowedOfficeIds?: string[];
  status?: OfficeRequestStatus | "all";
  type?: OfficeRequestType | "all";
  officeFilter?: string;
  pageSize?: number;
  bookingDateFrom?: string | null;
  bookingDateTo?: string | null;
  adminBookingTodayYmd?: string | null;
}): Promise<PaginatedResult<OfficeRequest> | null> {
  if (!isVpsApiEnabled() || !args.q.trim()) return null;
  return vpsListAdminRequests({
    scope: {
      role: args.role,
      officeId: args.officeId,
      allowedOfficeIds: args.allowedOfficeIds,
    },
    status: args.status,
    type: args.type,
    officeFilter: args.officeFilter,
    limit: args.pageSize,
    q: args.q.trim(),
    adminBookingTodayYmd: args.adminBookingTodayYmd,
    bookingDateFrom: args.bookingDateFrom,
    bookingDateTo: args.bookingDateTo,
  });
}
