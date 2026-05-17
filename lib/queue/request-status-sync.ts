import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { OfficeRequestStatus } from "@/lib/office-requests/types";

const REQUESTS = "requests";

export type RequestStatusSyncResult = {
  changed: boolean;
  requestId: string;
  officeId?: string;
  prevStatus?: OfficeRequestStatus;
  nextStatus?: OfficeRequestStatus;
};

/** After citizen checks in at the office (new or returning ticket today). */
export function statusAfterCheckIn(
  current: OfficeRequestStatus,
): OfficeRequestStatus | null {
  if (current === "completed" || current === "cancelled") return null;
  if (current === "in_progress") return null;
  if (current === "new" || current === "contacted") return "in_progress";
  return "in_progress";
}

/** After staff marks the queue ticket completed at the counter. */
export function statusAfterQueueComplete(
  current: OfficeRequestStatus,
): OfficeRequestStatus | null {
  if (current === "cancelled" || current === "completed") return null;
  return "completed";
}

export async function syncRequestStatusInTransaction(
  tx: FirebaseFirestore.Transaction,
  requestId: string,
  phase: "checked_in" | "completed",
): Promise<RequestStatusSyncResult> {
  const id = requestId.trim();
  if (!id) return { changed: false, requestId: id };

  const ref = getAdminDb().collection(REQUESTS).doc(id);
  const snap = await tx.get(ref);
  if (!snap.exists) return { changed: false, requestId: id };

  const data = snap.data() ?? {};
  const current = (data.status ?? "new") as OfficeRequestStatus;
  const officeId = String(data.officeId ?? "");
  const next =
    phase === "checked_in"
      ? statusAfterCheckIn(current)
      : statusAfterQueueComplete(current);

  if (!next) {
    return { changed: false, requestId: id, officeId };
  }

  tx.update(ref, {
    status: next,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    changed: true,
    requestId: id,
    officeId,
    prevStatus: current,
    nextStatus: next,
  };
}
