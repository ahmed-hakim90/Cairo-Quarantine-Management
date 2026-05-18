import { Timestamp } from "firebase-admin/firestore";
import { getPool } from "@cqm/shared";
import { getAdminDb, isFirebaseAdminConfigured } from "../lib/firebase.js";
const RETENTION_DAYS = 90;
const ARCHIVE_DELETE_MONTHS = 6;
const BATCH_LIMIT = 500;
const REQUESTS = "requests";
const ACTIVITY_LOGS = "activityLogs";
const REQUESTS_ARCHIVE = "requestsArchive";
const ACTIVITY_LOGS_ARCHIVE = "activityLogsArchive";
function retentionCutoffs(now) {
    const archiveBefore = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const deleteArchivesBefore = new Date(now);
    deleteArchivesBefore.setUTCMonth(deleteArchivesBefore.getUTCMonth() - ARCHIVE_DELETE_MONTHS);
    return { archiveBefore, deleteArchivesBefore };
}
function isClosedRequestStatus(status) {
    return status === "completed" || status === "cancelled";
}
function isOlderThan(value, cutoff) {
    if (value instanceof Timestamp) {
        return value.toMillis() < cutoff.getTime();
    }
    if (value instanceof Date)
        return value.getTime() < cutoff.getTime();
    if (typeof value === "string") {
        const ms = Date.parse(value);
        return Number.isFinite(ms) && ms < cutoff.getTime();
    }
    return false;
}
function shouldArchiveRequestData(data, cutoff) {
    return isClosedRequestStatus(data.status) && isOlderThan(data.updatedAt, cutoff);
}
function shouldArchiveActivityLogData(data, cutoff) {
    return isOlderThan(data.createdAt, cutoff);
}
function archivePayload(id, sourceCollection, data, archivedAt) {
    return {
        ...data,
        archivedAt,
        sourceCollection,
        sourceId: id,
    };
}
async function archiveOldClosedRequests(args) {
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
        if (!shouldArchiveRequestData(data, args.archiveBefore))
            continue;
        batch.set(db.collection(REQUESTS_ARCHIVE).doc(doc.id), archivePayload(doc.id, REQUESTS, data, args.archivedAt), { merge: true });
        batch.delete(doc.ref);
    }
    await batch.commit();
    return { archived: docs.length, truncated: snap.size > docs.length };
}
async function archiveOldActivityLogs(args) {
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
        if (!shouldArchiveActivityLogData(data, args.archiveBefore))
            continue;
        batch.set(db.collection(ACTIVITY_LOGS_ARCHIVE).doc(doc.id), archivePayload(doc.id, ACTIVITY_LOGS, data, args.archivedAt), { merge: true });
        batch.delete(doc.ref);
    }
    await batch.commit();
    return { archived: docs.length, truncated: snap.size > docs.length };
}
async function deleteExpiredArchivedDocuments(args) {
    const db = getAdminDb();
    const snap = await db
        .collection(args.collection)
        .where("archivedAt", "<", Timestamp.fromDate(args.deleteBefore))
        .orderBy("archivedAt", "asc")
        .limit(Math.min(args.maxDocs + 1, BATCH_LIMIT + 1))
        .get();
    const docs = snap.docs.slice(0, args.maxDocs);
    if (docs.length === 0)
        return { deleted: 0, truncated: false };
    const batch = db.batch();
    for (const doc of docs)
        batch.delete(doc.ref);
    await batch.commit();
    return { deleted: docs.length, truncated: snap.size > docs.length };
}
async function purgePgActivityLogs(config, archiveBefore, maxDocs) {
    const pool = getPool(config.databaseUrl);
    const result = await pool.query(`DELETE FROM activity_logs
     WHERE id IN (
       SELECT id FROM activity_logs
       WHERE created_at < $1
       ORDER BY created_at ASC
       LIMIT $2
     )`, [archiveBefore, maxDocs]);
    return result.rowCount ?? 0;
}
async function runFirestoreRetention(maxDocs, now) {
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
    const archivedActivityLogs = remaining > 0
        ? await archiveOldActivityLogs({
            archiveBefore,
            archivedAt,
            maxDocs: remaining,
        })
        : { archived: 0, truncated: true };
    remaining -= archivedActivityLogs.archived;
    truncated ||= archivedActivityLogs.truncated;
    const deletedRequests = remaining > 0
        ? await deleteExpiredArchivedDocuments({
            collection: REQUESTS_ARCHIVE,
            deleteBefore: deleteArchivesBefore,
            maxDocs: remaining,
        })
        : { deleted: 0, truncated: true };
    remaining -= deletedRequests.deleted;
    truncated ||= deletedRequests.truncated;
    const deletedLogs = remaining > 0
        ? await deleteExpiredArchivedDocuments({
            collection: ACTIVITY_LOGS_ARCHIVE,
            deleteBefore: deleteArchivesBefore,
            maxDocs: remaining,
        })
        : { deleted: 0, truncated: true };
    truncated ||= deletedLogs.truncated;
    return {
        archivedRequests: archivedRequests.archived,
        archivedActivityLogs: archivedActivityLogs.archived,
        deletedArchivedRequests: deletedRequests.deleted,
        deletedArchivedActivityLogs: deletedLogs.deleted,
        truncated,
    };
}
/** PG activity-log purge + optional Firestore archive during migration. */
export async function runRetentionJob(config) {
    const now = new Date();
    const maxDocs = Math.min(Math.max(1, Number.parseInt(process.env.RETENTION_MAX_DOCS ?? "400", 10) || 400), BATCH_LIMIT);
    const { archiveBefore } = retentionCutoffs(now);
    const deletedPgActivityLogs = await purgePgActivityLogs(config, archiveBefore, maxDocs);
    let firestorePart = {
        archivedRequests: 0,
        archivedActivityLogs: 0,
        deletedArchivedRequests: 0,
        deletedArchivedActivityLogs: 0,
        truncated: false,
    };
    if (isFirebaseAdminConfigured()) {
        firestorePart = await runFirestoreRetention(maxDocs, now);
    }
    else {
        console.info("[worker] retention: Firestore archive skipped (Firebase not configured)");
    }
    const result = {
        ...firestorePart,
        deletedPgActivityLogs,
        maxDocs,
    };
    if (result.archivedRequests > 0 ||
        result.archivedActivityLogs > 0 ||
        result.deletedPgActivityLogs > 0 ||
        result.deletedArchivedRequests > 0 ||
        result.deletedArchivedActivityLogs > 0) {
        console.info("[worker] retention", result);
    }
    return result;
}
