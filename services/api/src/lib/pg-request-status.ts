import type { PoolClient } from "@cqm/shared";
import type { OfficeRequestStatus } from "./domain.js";
import {
  statusAfterCheckIn,
  statusAfterQueueComplete,
} from "./domain.js";

export type RequestStatusSyncResult = {
  changed: boolean;
  requestId: string;
  officeId?: string;
  prevStatus?: OfficeRequestStatus;
  nextStatus?: OfficeRequestStatus;
};

export async function syncRequestStatusInTransaction(
  client: PoolClient,
  requestId: string,
  phase: "checked_in" | "completed",
): Promise<RequestStatusSyncResult> {
  const id = requestId.trim();
  if (!id) return { changed: false, requestId: id };

  const snap = await client.query<{
    status: OfficeRequestStatus;
    office_id: string;
  }>(
    `SELECT status, office_id FROM requests WHERE id = $1 FOR UPDATE`,
    [id],
  );
  if (snap.rowCount === 0) return { changed: false, requestId: id };

  const row = snap.rows[0]!;
  const current = row.status;
  const officeId = row.office_id;
  const next =
    phase === "checked_in"
      ? statusAfterCheckIn(current)
      : statusAfterQueueComplete(current);

  if (!next) {
    return { changed: false, requestId: id, officeId };
  }

  await client.query(
    `UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2`,
    [next, id],
  );

  return {
    changed: true,
    requestId: id,
    officeId,
    prevStatus: current,
    nextStatus: next,
  };
}
