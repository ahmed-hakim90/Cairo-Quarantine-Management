import { Timestamp } from "firebase-admin/firestore";
import {
  archiveOldPublicEvents,
  deleteExpiredPublicEventArchives,
  deleteStalePublicSessions,
} from "@/lib/analytics/public-analytics-store";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { RetentionRunResult } from "@/lib/office-requests/types";

const REQUESTS = "requests";
const ACTIVITY_LOGS = "activityLogs";
const REQUESTS_ARCHIVE = "requestsArchive";
const ACTIVITY_LOGS_ARCHIVE = "activityLogsArchive";
const RETENTION_DAYS = 90;
const ARCHIVE_DELETE_MONTHS = 6;
const BATCH_LIMIT = 500;

export function retentionCutoffs(now: Date): {
  archiveBefore: Date;
  deleteArchivesBefore: Date;
} {
  const archiveBefore = new Date(
    now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
  const deleteArchivesBefore = new Date(now);
  deleteArchivesBefore.setUTCMonth(
    deleteArchivesBefore.getUTCMonth() - ARCHIVE_DELETE_MONTHS,
  );
  return { archiveBefore, deleteArchivesBefore };
}

export function isClosedRequestStatus(status: unknown): boolean {
  return status === "completed" || status === "cancelled";
}

function isOlderThan(value: unknown, cutoff: Date): boolean {
  if (value instanceof Timestamp) {
    return value.toMillis() < cutoff.getTime();
  }
  if (value instanceof Date) return value.getTime() < cutoff.getTime();
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) && ms < cutoff.getTime();
  }
  return false;
}

export function shouldArchiveRequestData(
  data: Record<string, unknown>,
  cutoff: Date,
): boolean {
  return isClosedRequestStatus(data.status) && isOlderThan(data.updatedAt, cutoff);
}

export function shouldArchiveActivityLogData(
  data: Record<string, unknown>,
  cutoff: Date,
): boolean {
  return isOlderThan(data.createdAt, cutoff);
}

function archivePayload(
  id: string,
  sourceCollection: string,
  data: FirebaseFirestore.DocumentData,
  archivedAt: Timestamp,
) {
  return {
    ...data,
    archivedAt,
    sourceCollection,
    sourceId: id,
  };
}

export async function archiveOldClosedRequests(args: {
  archiveBefore: Date;
  archivedAt: Timestamp;
  maxDocs: number;
}): Promise<{ archived: number; truncated: boolean }> {
  const db = getAdminDb();
  const query = db
    .collection(REQUESTS)
    .where("status", "in", ["completed", "cancelled"])
    .where("updatedAt", "<", Timestamp.fromDate(args.archiveBefore))
    .orderBy("updatedAt", "asc")
    .limit(Math.min(args.maxDocs + 1, BATCH_LIMIT + 1));
  const snap = await query.get();
  const docs = snap.docs.slice(0, args.maxDocs);
  if (docs.length === 0) {
    return { archived: 0, truncated: false };
  }

  const batch = db.batch();
  for (const doc of docs) {
    const data = doc.data() ?? {};
    if (!shouldArchiveRequestData(data, args.archiveBefore)) continue;
    batch.set(
      db.collection(REQUESTS_ARCHIVE).doc(doc.id),
      archivePayload(doc.id, REQUESTS, data, args.archivedAt),
      { merge: true },
    );
    batch.delete(doc.ref);
  }
  await batch.commit();
  return { archived: docs.length, truncated: snap.size > docs.length };
}

export async function archiveOldActivityLogs(args: {
  archiveBefore: Date;
  archivedAt: Timestamp;
  maxDocs: number;
}): Promise<{ archived: number; truncated: boolean }> {
  const db = getAdminDb();
  const query = db
    .collection(ACTIVITY_LOGS)
    .where("createdAt", "<", Timestamp.fromDate(args.archiveBefore))
    .orderBy("createdAt", "asc")
    .limit(Math.min(args.maxDocs + 1, BATCH_LIMIT + 1));
  const snap = await query.get();
  const docs = snap.docs.slice(0, args.maxDocs);
  if (docs.length === 0) {
    return { archived: 0, truncated: false };
  }

  const batch = db.batch();
  for (const doc of docs) {
    const data = doc.data() ?? {};
    if (!shouldArchiveActivityLogData(data, args.archiveBefore)) continue;
    batch.set(
      db.collection(ACTIVITY_LOGS_ARCHIVE).doc(doc.id),
      archivePayload(doc.id, ACTIVITY_LOGS, data, args.archivedAt),
      { merge: true },
    );
    batch.delete(doc.ref);
  }
  await batch.commit();
  return { archived: docs.length, truncated: snap.size > docs.length };
}

export async function deleteExpiredArchivedDocuments(args: {
  collection: typeof REQUESTS_ARCHIVE | typeof ACTIVITY_LOGS_ARCHIVE;
  deleteBefore: Date;
  maxDocs: number;
}): Promise<{ deleted: number; truncated: boolean }> {
  const db = getAdminDb();
  const snap = await db
    .collection(args.collection)
    .where("archivedAt", "<", Timestamp.fromDate(args.deleteBefore))
    .orderBy("archivedAt", "asc")
    .limit(Math.min(args.maxDocs + 1, BATCH_LIMIT + 1))
    .get();
  const docs = snap.docs.slice(0, args.maxDocs);
  if (docs.length === 0) return { deleted: 0, truncated: false };

  const batch = db.batch();
  for (const doc of docs) batch.delete(doc.ref);
  await batch.commit();
  return { deleted: docs.length, truncated: snap.size > docs.length };
}

export async function runRetentionMaintenance(args?: {
  now?: Date;
  maxDocs?: number;
}): Promise<RetentionRunResult> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("خدمة التخزين غير مهيأة حالياً.");
  }

  const now = args?.now ?? new Date();
  const maxDocs = Math.min(Math.max(1, args?.maxDocs ?? 400), BATCH_LIMIT);
  const { archiveBefore, deleteArchivesBefore } = retentionCutoffs(now);
  const archivedAt = Timestamp.fromDate(now);
  let remaining = maxDocs;
  let truncated = false;

  const archivedRequests = await archiveOldClosedRequests({
    archiveBefore,
    archivedAt,
    maxDocs: remaining,
  });
  remaining -= archivedRequests.archived;
  truncated ||= archivedRequests.truncated;

  const archivedActivityLogs =
    remaining > 0
      ? await archiveOldActivityLogs({
          archiveBefore,
          archivedAt,
          maxDocs: remaining,
        })
      : { archived: 0, truncated: true };
  remaining -= archivedActivityLogs.archived;
  truncated ||= archivedActivityLogs.truncated;

  const deletedRequests =
    remaining > 0
      ? await deleteExpiredArchivedDocuments({
          collection: REQUESTS_ARCHIVE,
          deleteBefore: deleteArchivesBefore,
          maxDocs: remaining,
        })
      : { deleted: 0, truncated: true };
  remaining -= deletedRequests.deleted;
  truncated ||= deletedRequests.truncated;

  const deletedLogs =
    remaining > 0
      ? await deleteExpiredArchivedDocuments({
          collection: ACTIVITY_LOGS_ARCHIVE,
          deleteBefore: deleteArchivesBefore,
          maxDocs: remaining,
        })
      : { deleted: 0, truncated: true };
  truncated ||= deletedLogs.truncated;

  const staleSessionBefore = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000,
  );
  const deletedStalePublicSessions =
    remaining > 0
      ? await deleteStalePublicSessions({
          staleBefore: staleSessionBefore,
          maxDocs: remaining,
        })
      : { deleted: 0, truncated: true };
  remaining -= deletedStalePublicSessions.deleted;
  truncated ||= deletedStalePublicSessions.truncated;

  const archivedPublicEvents =
    remaining > 0
      ? await archiveOldPublicEvents({
          archiveBefore,
          archivedAt,
          maxDocs: remaining,
        })
      : { archived: 0, truncated: true };
  remaining -= archivedPublicEvents.archived;
  truncated ||= archivedPublicEvents.truncated;

  const deletedPublicEvents =
    remaining > 0
      ? await deleteExpiredPublicEventArchives({
          deleteBefore: deleteArchivesBefore,
          maxDocs: remaining,
        })
      : { deleted: 0, truncated: true };
  truncated ||= deletedPublicEvents.truncated;

  return {
    archivedRequests: archivedRequests.archived,
    archivedActivityLogs: archivedActivityLogs.archived,
    archivedPublicEvents: archivedPublicEvents.archived,
    deletedArchivedRequests: deletedRequests.deleted,
    deletedArchivedActivityLogs: deletedLogs.deleted,
    deletedArchivedPublicEvents: deletedPublicEvents.deleted,
    deletedStalePublicSessions: deletedStalePublicSessions.deleted,
    truncated,
    maxDocs,
  };
}
