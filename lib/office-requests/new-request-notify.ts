import {
  adminCanAccessOffice,
  isRequestVisibleToAdminRole,
  isSingleOfficeStaffRole,
} from "@/lib/office-requests/admin-access";
import type {
  AdminRole,
  OfficeRequest,
  OfficeRequestStatus,
  OfficeRequestType,
} from "@/lib/office-requests/types";

export const FIRESTORE_IN_QUERY_MAX = 30;

export const REQUESTS_COLLECTION = "requests";

export type NotifyScope = {
  role: AdminRole;
  officeId: string | null;
  allowedOfficeIds: string[];
};

export type NotifyRequestPayload = Pick<
  OfficeRequest,
  "id" | "officeId" | "officeNameAr" | "type" | "status" | "name"
>;

export function notifyScopeFromProfile(profile: {
  role: AdminRole;
  officeId: string | null;
  allowedOfficeIds?: string[];
}): NotifyScope {
  const officeId = profile.officeId?.trim() || null;
  if (profile.role === "super_admin") {
    return { role: profile.role, officeId, allowedOfficeIds: [] };
  }
  if (profile.role === "office_admin" || profile.role === "governorate_admin") {
    const allowedOfficeIds = [
      ...new Set(
        (profile.allowedOfficeIds ?? [])
          .map((id) => String(id).trim())
          .filter(Boolean),
      ),
    ];
    return { role: profile.role, officeId, allowedOfficeIds };
  }
  return {
    role: profile.role,
    officeId,
    allowedOfficeIds: officeId ? [officeId] : [],
  };
}

/** Office ID batches for `officeId in` listeners; empty for super_admin (global listener). */
export function buildNotifyOfficeIdBatches(scope: NotifyScope): string[][] {
  if (scope.role === "super_admin") return [];
  if (isSingleOfficeStaffRole(scope.role)) {
    const id = scope.officeId?.trim();
    return id ? [[id]] : [];
  }
  const ids = scope.allowedOfficeIds;
  if (ids.length === 0) return [];
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += FIRESTORE_IN_QUERY_MAX) {
    batches.push(ids.slice(i, i + FIRESTORE_IN_QUERY_MAX));
  }
  return batches;
}

export function shouldNotifyRequest(
  request: Pick<OfficeRequest, "officeId" | "status" | "type">,
  scope: NotifyScope,
): boolean {
  if (request.status !== "new") return false;
  if (!isRequestVisibleToAdminRole(scope.role, request)) return false;
  return adminCanAccessOffice(
    {
      role: scope.role,
      officeId: scope.officeId,
      allowedOfficeIds: scope.allowedOfficeIds,
    },
    request.officeId,
  );
}

export function requestFromFirestoreSnapshot(
  id: string,
  data: Record<string, unknown>,
): NotifyRequestPayload {
  return {
    id,
    officeId: String(data.officeId ?? ""),
    officeNameAr: String(data.officeNameAr ?? ""),
    type: (data.type ?? "booking") as OfficeRequestType,
    status: (data.status ?? "new") as OfficeRequestStatus,
    name: String(data.name ?? ""),
  };
}
