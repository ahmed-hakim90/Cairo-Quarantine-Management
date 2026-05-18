import type { OfficeRequest } from "@/lib/office-requests/types";

export type QueueTicketStatus = "waiting" | "completed";
export type QueueCreatedFrom = "existing_request" | "new_request";

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

export type DailyStats = {
  id: string;
  date: string;
  officeId: string;
  totalCheckedIn: number;
  totalCompleted: number;
  totalNoShow: number;
  totalNewRequests: number;
  lastQueueNumber: number;
  /** Last completed ticket queue number for approximate ahead display. */
  currentServingNumber?: number;
  closed: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type QueueRequestSummary = Pick<
  OfficeRequest,
  | "id"
  | "requestNumber"
  | "name"
  | "phone"
  | "type"
  | "status"
  | "preferredDate"
  | "details"
  | "notes"
  | "createdAt"
>;

export type QueueTicketWithRequest = QueueTicket & {
  request: QueueRequestSummary | null;
};

export type QueuePositionPublic = {
  ticketId: string;
  queueNumber: number;
  status: QueueTicketStatus;
  aheadCount: number;
  queueClosed: boolean;
  message: string;
};

