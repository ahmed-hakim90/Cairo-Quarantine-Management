import type {
  Office,
  OfficeRequest,
  OfficeRequestStatus,
  OfficeRequestType,
  QueueCreatedFrom,
  QueueTicket,
  QueueTicketStatus,
  TravelerCategory,
} from "./domain.js";

type OfficeRow = {
  id: string;
  governorate_id: string;
  serial_in_governorate: number;
  administration_ar: string;
  name_ar: string;
  address_ar: string;
  phone: string | null;
  maps_url: string;
  service: Office["service"];
  active: boolean;
  traveler_state_ids: string[] | null;
  daily_booking_cap: number | null;
};

type RequestRow = {
  id: string;
  request_number: string;
  request_sequence: number | null;
  governorate_id: string | null;
  office_id: string;
  office_name_ar: string;
  type: OfficeRequestType;
  traveler_state_id: string | null;
  traveler_category: TravelerCategory | null;
  preferred_date: Date | string | null;
  status: OfficeRequestStatus;
  name: string;
  phone: string;
  details: string;
  notes: string;
  has_special_needs: boolean;
  has_elderly: boolean;
  pass_token: string | null;
  pass_token_expires_at: Date | null;
  last_whatsapp_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type TicketRow = {
  id: string;
  request_id: string;
  request_number: string;
  office_id: string;
  queue_date: Date | string;
  queue_number: number;
  status: QueueTicketStatus;
  checked_in_at: Date;
  completed_at: Date | null;
  created_from: QueueCreatedFrom;
};

function ymd(value: Date | string | null | undefined): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function iso(value: Date | null | undefined): string | undefined {
  return value ? value.toISOString() : undefined;
}

export function officeFromRow(row: OfficeRow): Office {
  const stateIds = row.traveler_state_ids?.filter(Boolean) ?? [];
  return {
    id: row.id,
    governorateId: row.governorate_id,
    serialInGovernorate: row.serial_in_governorate,
    administrationAr: row.administration_ar,
    nameAr: row.name_ar,
    addressAr: row.address_ar,
    phone: row.phone,
    mapsUrl: row.maps_url,
    service: row.service,
    active: row.active,
    ...(stateIds.length > 0 ? { travelerStateIds: stateIds } : {}),
    ...(row.daily_booking_cap != null && row.daily_booking_cap > 0
      ? { dailyBookingCap: row.daily_booking_cap }
      : {}),
  };
}

export function requestFromRow(row: RequestRow): OfficeRequest {
  return {
    id: row.id,
    requestNumber: row.request_number,
    ...(row.request_sequence != null ? { requestSequence: row.request_sequence } : {}),
    ...(row.governorate_id ? { governorateId: row.governorate_id } : {}),
    officeId: row.office_id,
    officeNameAr: row.office_name_ar,
    type: row.type,
    ...(row.traveler_state_id ? { travelerStateId: row.traveler_state_id } : {}),
    ...(row.traveler_category ? { travelerCategory: row.traveler_category } : {}),
    ...(ymd(row.preferred_date) ? { preferredDate: ymd(row.preferred_date) } : {}),
    status: row.status,
    name: row.name,
    phone: row.phone,
    details: row.details,
    notes: row.notes,
    ...(row.has_special_needs ? { hasSpecialNeeds: true } : {}),
    ...(row.has_elderly ? { hasElderly: true } : {}),
    ...(row.pass_token ? { passToken: row.pass_token } : {}),
    ...(iso(row.pass_token_expires_at)
      ? { passTokenExpiresAt: iso(row.pass_token_expires_at) }
      : {}),
    ...(iso(row.last_whatsapp_at) ? { lastWhatsappAt: iso(row.last_whatsapp_at) } : {}),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function ticketFromRow(row: TicketRow): QueueTicket {
  return {
    id: row.id,
    requestId: row.request_id,
    requestNumber: row.request_number,
    officeId: row.office_id,
    queueDate: ymd(row.queue_date) ?? "",
    queueNumber: row.queue_number,
    status: row.status,
    checkedInAt: row.checked_in_at.toISOString(),
    ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {}),
    createdFrom: row.created_from,
  };
}

export function publicRequestStatus(
  request: OfficeRequest,
  options?: { includePassToken?: boolean },
) {
  return {
    id: request.id,
    requestNumber: request.requestNumber,
    ...(request.governorateId ? { governorateId: request.governorateId } : {}),
    officeNameAr: request.officeNameAr,
    type: request.type,
    ...(request.travelerStateId ? { travelerStateId: request.travelerStateId } : {}),
    ...(request.travelerCategory ? { travelerCategory: request.travelerCategory } : {}),
    ...(request.preferredDate ? { preferredDate: request.preferredDate } : {}),
    status: request.status,
    notes: request.notes,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    ...(options?.includePassToken && request.passToken
      ? { passToken: request.passToken }
      : {}),
  };
}
