/** Portable domain helpers (mirrors monorepo `lib/` without Next.js imports). */

export type OfficeRequestType = "booking" | "complaint" | "proposal";
export type TravelerCategory = "international" | "hajj_umrah" | "citizen";
export type OfficeRequestStatus =
  | "new"
  | "in_progress"
  | "contacted"
  | "completed"
  | "cancelled";
export type AdminRole =
  | "super_admin"
  | "governorate_admin"
  | "office_admin"
  | "office_user";
export type QueueTicketStatus = "waiting" | "completed";
export type QueueCreatedFrom = "existing_request" | "new_request";

export type Office = {
  id: string;
  governorateId: string;
  serialInGovernorate: number;
  administrationAr: string;
  nameAr: string;
  addressAr: string;
  phone: string | null;
  mapsUrl: string;
  service: "hajj_umrah_travelers" | "hajj_umrah_only";
  active: boolean;
  travelerStateIds?: string[];
  dailyBookingCap?: number | null;
};

export type OfficeRequest = {
  id: string;
  requestNumber: string;
  requestSequence?: number;
  governorateId?: string;
  officeId: string;
  officeNameAr: string;
  type: OfficeRequestType;
  travelerStateId?: string;
  travelerCategory?: TravelerCategory;
  preferredDate?: string;
  status: OfficeRequestStatus;
  name: string;
  phone: string;
  details: string;
  notes: string;
  hasSpecialNeeds?: boolean;
  hasElderly?: boolean;
  passToken?: string;
  passTokenExpiresAt?: string;
  lastWhatsappAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicOfficeRequestStatus = Pick<
  OfficeRequest,
  | "id"
  | "requestNumber"
  | "governorateId"
  | "officeNameAr"
  | "type"
  | "travelerStateId"
  | "travelerCategory"
  | "preferredDate"
  | "status"
  | "notes"
  | "createdAt"
  | "updatedAt"
> & { passToken?: string };

export type CreatedOfficeRequestPublic = PublicOfficeRequestStatus & {
  passToken: string;
};

export type QueueTicket = {
  id: string;
  requestId: string;
  requestNumber: string;
  officeId: string;
  queueDate: string;
  queueNumber: number;
  status: QueueTicketStatus;
  checkedInAt: string;
  completedAt?: string;
  createdFrom: QueueCreatedFrom;
};

export type QueuePositionPublic = {
  ticketId: string;
  queueNumber: number;
  status: QueueTicketStatus;
  aheadCount: number;
  queueClosed: boolean;
  message: string;
};

export const DEFAULT_GOVERNORATE_ID = "cairo";
export const DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR = 14;

export const DUPLICATE_BOOKING_MESSAGE =
  "هذا الطلب مسجّل مسبقاً. راجع صفحة طلباتي لمتابعة حجزك.";

export const REQUEST_STATUS_LABELS: Record<OfficeRequestStatus, string> = {
  new: "جديد",
  in_progress: "قيد المعالجة",
  contacted: "تم التواصل",
  completed: "مكتمل",
  cancelled: "ملغى",
};

const GOVERNORATE_IDS = new Set([
  "cairo",
  "giza",
  "alexandria",
  "qalyubia",
  "port_said",
  "suez",
  "luxor",
  "dakahlia",
  "sharqia",
  "gharbia",
  "monufia",
  "beheira",
  "kafr_el_sheikh",
  "damietta",
  "ismailia",
  "fayoum",
  "beni_suef",
  "minya",
  "assiut",
  "sohag",
  "qena",
  "aswan",
  "red_sea",
  "new_valley",
  "matrouh",
  "north_sinai",
  "south_sinai",
]);

export function normalizeGovernorateId(value: unknown): string {
  const id = String(value ?? "").trim();
  return GOVERNORATE_IDS.has(id) ? id : DEFAULT_GOVERNORATE_ID;
}

export function formatRequestNumber(officeId: string, sequence: number): string {
  return `${officeId.trim()}-${String(sequence).padStart(6, "0")}`;
}

export function requestNumberLookupVariants(value: string): string[] {
  const compact = value.trim().replace(/\s+/g, "");
  const values = new Set<string>();
  if (compact) {
    values.add(compact);
    values.add(compact.toUpperCase());
    values.add(compact.toLowerCase());
  }
  const digits = compact.replace(/\D/g, "");
  if (digits) {
    values.add(digits);
    values.add(`CQM-${digits.padStart(6, "0")}`);
  }
  return [...values];
}

function egyptianInternationalDigits(value: string): string | null {
  let d = value.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("0020")) d = d.slice(2);
  if (d.startsWith("20") && d.length === 12 && /^20(?:10|11|12|15)/.test(d)) {
    return d;
  }
  if (d.startsWith("01") && d.length === 11 && /^01[0125]/.test(d)) {
    return `20${d.slice(1)}`;
  }
  if (d.length === 10 && /^1[0125]/.test(d)) {
    return `20${d}`;
  }
  return null;
}

export function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

export function normalizePhoneForStorage(value: string): string {
  const intl = egyptianInternationalDigits(value);
  if (intl) return `+${intl}`;
  return normalizePhone(value);
}

export function phoneLookupVariants(value: string): string[] {
  const variants = new Set<string>();
  const cleaned = normalizePhone(value);
  const digits = value.replace(/\D/g, "");
  if (cleaned) variants.add(cleaned);
  if (digits) variants.add(digits);
  const intl = egyptianInternationalDigits(value);
  if (intl) {
    variants.add(`+${intl}`);
    variants.add(intl);
    variants.add(`00${intl}`);
    variants.add(`0${intl.slice(2)}`);
    variants.add(intl.slice(2));
  }
  return [...variants].filter(Boolean);
}

export function bookingPassTokenExpiresAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
}

export function deriveTravelerStateIdsFromService(
  service: Office["service"],
): string[] {
  if (service === "hajj_umrah_only") return ["hajj_umrah", "citizen"];
  return ["international", "hajj_umrah", "citizen"];
}

export function getOfficeTravelerStateIds(office: Office): string[] {
  const raw = office.travelerStateIds;
  if (Array.isArray(raw) && raw.length > 0) {
    return [...new Set(raw.map(String).filter(Boolean))];
  }
  return deriveTravelerStateIdsFromService(office.service);
}

export function officeAcceptsTravelerState(office: Office, stateId: string): boolean {
  return getOfficeTravelerStateIds(office).includes(stateId);
}

export function normalizeBookingNameForCompare(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function isDuplicateBookingCandidate(
  doc: { status: OfficeRequestStatus; travelerStateId?: string; name: string },
  input: {
    travelerStateId: string;
    name: string;
  },
): boolean {
  if (doc.status === "cancelled") return false;
  const docStateId = doc.travelerStateId?.trim();
  const inputStateId = input.travelerStateId.trim();
  if (!docStateId || docStateId !== inputStateId) return false;
  return (
    normalizeBookingNameForCompare(doc.name) ===
    normalizeBookingNameForCompare(input.name)
  );
}

export function findMatchingDuplicateBooking<
  T extends { status: OfficeRequestStatus; travelerStateId?: string; name: string },
>(docs: T[], input: { travelerStateId: string; name: string }): T | null {
  for (const doc of docs) {
    if (isDuplicateBookingCandidate(doc, input)) return doc;
  }
  return null;
}

export function statusAfterCheckIn(
  current: OfficeRequestStatus,
): OfficeRequestStatus | null {
  if (current === "completed" || current === "cancelled") return null;
  if (current === "in_progress") return null;
  return "in_progress";
}

export function statusAfterQueueComplete(
  current: OfficeRequestStatus,
): OfficeRequestStatus | null {
  if (current === "cancelled" || current === "completed") return null;
  return "completed";
}

export function nextQueueNumber(lastQueueNumber: number): number {
  return lastQueueNumber + 1;
}

export function shouldSkipNewTicket(existingTicketExists: boolean): boolean {
  return existingTicketExists;
}

export function shouldIncrementTotalCompleted(status: QueueTicketStatus): boolean {
  return status !== "completed";
}

export function queueTicketId(args: {
  requestId: string;
  officeId: string;
  queueDate: string;
}): string {
  return `${args.queueDate}_${args.officeId}_${args.requestId}`;
}

export function dailyStatsId(date: string, officeId: string): string {
  return `${date}_${officeId}`;
}

export function queuePositionMessage(
  status: QueueTicketStatus,
  aheadCount: number,
  queueClosed: boolean,
): string {
  if (queueClosed) return "تم إغلاق طابور اليوم لهذا المكتب.";
  if (status === "completed") return "تم الانتهاء من المكتب.";
  if (aheadCount === 0) return "توجّه إلى شباك المكتب";
  if (aheadCount === 1) return "أمامك شخص واحد في الانتظار";
  return `أمامك ${aheadCount} أشخاص في الانتظار`;
}

const CAIRO_TZ = "Africa/Cairo";

export function getCairoTodayYmd(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function resolvedCutoffHour(sameDayCutoffHour?: number): number {
  const h =
    typeof sameDayCutoffHour === "number" && Number.isFinite(sameDayCutoffHour)
      ? Math.floor(sameDayCutoffHour)
      : DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR;
  return Math.min(23, Math.max(0, h));
}

function getCairoHour24(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CAIRO_TZ,
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value;
  return hour != null ? Number.parseInt(hour, 10) : 0;
}

function firstCairoYmdAfter(ymd: string, from: Date): string {
  let t = from.getTime();
  for (let i = 0; i < 60; i++) {
    t += 3_600_000;
    const candidate = getCairoTodayYmd(new Date(t));
    if (candidate > ymd) return candidate;
  }
  return getCairoTodayYmd(new Date(from.getTime() + 48 * 3_600_000));
}

export function getCairoMinBookingYmd(
  from = new Date(),
  options?: { sameDayCutoffHour?: number },
): string {
  const cutoff = resolvedCutoffHour(options?.sameDayCutoffHour);
  const today = getCairoTodayYmd(from);
  if (getCairoHour24(from) >= cutoff) {
    return firstCairoYmdAfter(today, from);
  }
  return today;
}

export function normalizeOfficeIds(ids: readonly unknown[]): string[] {
  return [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
}

export function adminCanAccessOffice(
  profile: {
    role: AdminRole;
    officeId: string | null;
    allowedOfficeIds?: string[];
  },
  officeId: string | null | undefined,
): boolean {
  const id = officeId?.trim();
  if (!id) return false;
  if (profile.role === "super_admin") return true;
  const allowed =
    profile.role === "office_admin" || profile.role === "governorate_admin"
      ? normalizeOfficeIds(profile.allowedOfficeIds ?? [])
      : profile.officeId?.trim()
        ? [profile.officeId.trim()]
        : [];
  return allowed.includes(id);
}

export function normalizeRequestLookup(value: string): {
  raw: string;
  phoneVariants: string[];
  requestNumbers: string[];
} {
  const raw = value.trim();
  return {
    raw,
    phoneVariants: phoneLookupVariants(raw),
    requestNumbers: requestNumberLookupVariants(raw),
  };
}
