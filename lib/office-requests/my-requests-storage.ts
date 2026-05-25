import type { PublicOfficeRequestStatus } from "@/lib/office-requests/types";

export const MY_REQUESTS_STORAGE_KEY = "cairo-office-requests:v1";
export const MY_REQUESTS_CHANGED_EVENT = "cairo-my-requests-changed";
const MAX_STORED_REQUESTS = 20;

export type StoredOfficeRequest = PublicOfficeRequestStatus & {
  phone: string;
  passToken?: string;
  missing?: boolean;
};

function isStoredOfficeRequest(value: unknown): value is StoredOfficeRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Record<string, unknown>;
  return typeof request.id === "string" && typeof request.phone === "string";
}

function notifyMyRequestsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MY_REQUESTS_CHANGED_EVENT));
}

export function readStoredRequests(): StoredOfficeRequest[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(MY_REQUESTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoredOfficeRequest) : [];
  } catch {
    return [];
  }
}

export function writeStoredRequests(requests: StoredOfficeRequest[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    MY_REQUESTS_STORAGE_KEY,
    JSON.stringify(requests.slice(0, MAX_STORED_REQUESTS)),
  );
  notifyMyRequestsChanged();
}

export function upsertStoredRequest(request: StoredOfficeRequest): void {
  const current = readStoredRequests();
  const next = [
    request,
    ...current.filter((item) => item.id !== request.id),
  ].slice(0, MAX_STORED_REQUESTS);
  writeStoredRequests(next);
}

export function removeStoredRequest(id: string): void {
  writeStoredRequests(readStoredRequests().filter((request) => request.id !== id));
}

export function hasStoredRequests(): boolean {
  return readStoredRequests().length > 0;
}
