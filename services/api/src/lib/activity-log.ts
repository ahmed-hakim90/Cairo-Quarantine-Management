import type { PoolClient } from "@cqm/shared";
import type { OfficeRequestStatus } from "./domain.js";
import { REQUEST_STATUS_LABELS } from "./domain.js";

export async function appendActivityLog(
  client: PoolClient,
  payload: {
    actorUid: string;
    actorLabel: string;
    action: string;
    summaryAr: string;
    officeId: string | null;
    requestId?: string;
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO activity_logs (
      actor_uid, actor_label, action, summary_ar, office_id, request_id, meta
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      payload.actorUid,
      payload.actorLabel,
      payload.action,
      payload.summaryAr,
      payload.officeId,
      payload.requestId ?? null,
      JSON.stringify(payload.meta ?? {}),
    ],
  );
}

export async function recordQueueRequestStatusFromQueue(
  client: PoolClient,
  args: {
    requestId: string;
    officeId: string;
    prevStatus: OfficeRequestStatus;
    nextStatus: OfficeRequestStatus;
    phase: "checked_in" | "completed";
  },
): Promise<void> {
  const summaryAr =
    args.phase === "checked_in"
      ? `تسجيل حضور — الحالة «${REQUEST_STATUS_LABELS[args.prevStatus]}» → «${REQUEST_STATUS_LABELS[args.nextStatus]}»`
      : `إتمام من المكتب — الحالة «${REQUEST_STATUS_LABELS[args.prevStatus]}» → «${REQUEST_STATUS_LABELS[args.nextStatus]}»`;

  await appendActivityLog(client, {
    actorUid: "queue",
    actorLabel: "طابور المكتب",
    action: "request.updated",
    summaryAr,
    officeId: args.officeId,
    requestId: args.requestId,
    meta: {
      source: "queue",
      phase: args.phase,
      prevStatus: args.prevStatus,
      nextStatus: args.nextStatus,
    },
  });
}
