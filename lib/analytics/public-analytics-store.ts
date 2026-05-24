import {
  FieldValue,
  Timestamp,
  type Transaction,
} from "firebase-admin/firestore";
import { getCairoTodayYmd } from "@/lib/cairo-today-ymd";
import {
  aggregateDailyPublicStats,
  computeDailyStatsDelta,
  deviceClassFromUserAgent,
  isPublicFormType,
  maskPhoneForAnalytics,
  shouldPersistPublicAnalyticsEvent,
  type DailyPublicStatsDelta,
  type PublicAnalyticsIngestInput,
} from "@/lib/analytics/public-event-schema";
import type {
  DailyPublicStats,
  PlatformInsightsSnapshot,
  PublicEventRecord,
  PublicFormType,
  PublicProblemEvent,
  PublicSessionRecord,
} from "@/lib/analytics/public-analytics-types";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const PUBLIC_EVENTS = "public_events";
export const PUBLIC_EVENTS_ARCHIVE = "public_events_archive";
export const PUBLIC_SESSIONS = "public_sessions";
export const DAILY_PUBLIC_STATS = "daily_public_stats";

export const ACTIVE_SESSION_WINDOW_MS = 3 * 60 * 1000;

function iso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function sessionFromDoc(
  sessionId: string,
  data: FirebaseFirestore.DocumentData,
): PublicSessionRecord {
  return {
    sessionId,
    createdAt: iso(data.createdAt),
    lastSeenAt: iso(data.lastSeenAt),
    ...(data.endedAt ? { endedAt: iso(data.endedAt) } : {}),
    locale: String(data.locale ?? "ar"),
    firstPath: String(data.firstPath ?? ""),
    lastPath: String(data.lastPath ?? ""),
    pageViewCount: num(data.pageViewCount),
    durationSeconds: num(data.durationSeconds),
    deviceClass: data.deviceClass === "mobile" ? "mobile" : "desktop",
    ...(data.formActive === true ? { formActive: true } : {}),
    ...(typeof data.formType === "string"
      ? { formType: data.formType as PublicFormType }
      : {}),
    ...(typeof data.lastFormStep === "string"
      ? { lastFormStep: data.lastFormStep }
      : {}),
    ...(typeof data.officeId === "string" ? { officeId: data.officeId } : {}),
    ...(typeof data.maskedPhone === "string"
      ? { maskedPhone: data.maskedPhone }
      : {}),
    ...(typeof data.preferredDate === "string"
      ? { preferredDate: data.preferredDate }
      : {}),
  };
}

function eventFromDoc(
  id: string,
  data: FirebaseFirestore.DocumentData,
): PublicEventRecord {
  return {
    id,
    sessionId: String(data.sessionId ?? ""),
    action: data.action as PublicEventRecord["action"],
    path: String(data.path ?? ""),
    locale: String(data.locale ?? "ar"),
    createdAt: iso(data.createdAt),
    ...(data.meta && typeof data.meta === "object"
      ? { meta: data.meta as Record<string, unknown> }
      : {}),
  };
}

function emptyDailyStats(date: string): DailyPublicStats {
  return {
    date,
    pageViews: 0,
    uniqueSessions: 0,
    totalSessionSeconds: 0,
    avgSessionSeconds: 0,
    byPath: {},
    formStarts: 0,
    formSubmits: 0,
    formAbandonments: 0,
    formErrors: 0,
    apiErrors: 0,
    activeNowPeak: 0,
  };
}

export function parseDailyPublicStats(
  date: string,
  data: FirebaseFirestore.DocumentData | undefined,
): DailyPublicStats {
  const totalSessionSeconds = num(data?.totalSessionSeconds);
  const uniqueSessions = num(data?.uniqueSessions);
  return {
    date: String(data?.date ?? date),
    pageViews: num(data?.pageViews),
    uniqueSessions,
    totalSessionSeconds,
    avgSessionSeconds:
      uniqueSessions > 0
        ? Math.round(totalSessionSeconds / uniqueSessions)
        : 0,
    byPath:
      data?.byPath && typeof data.byPath === "object"
        ? Object.entries(data.byPath as Record<string, unknown>).reduce<
            Record<string, number>
          >((acc, [k, v]) => {
            acc[k] = num(v);
            return acc;
          }, {})
        : {},
    formStarts: num(data?.formStarts),
    formSubmits: num(data?.formSubmits),
    formAbandonments: num(data?.formAbandonments),
    formErrors: num(data?.formErrors),
    apiErrors: num(data?.apiErrors),
    activeNowPeak: num(data?.activeNowPeak),
  };
}

function applyDailyStatsDelta(
  tx: Transaction,
  date: string,
  delta: Partial<DailyPublicStatsDelta>,
  durationSeconds?: number,
): void {
  const ref = getAdminDb().collection(DAILY_PUBLIC_STATS).doc(date);
  const updates: Record<string, unknown> = {
    date,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (delta.pageViews) updates.pageViews = FieldValue.increment(delta.pageViews);
  if (delta.uniqueSessions) {
    updates.uniqueSessions = FieldValue.increment(delta.uniqueSessions);
  }
  if (delta.formStarts) updates.formStarts = FieldValue.increment(delta.formStarts);
  if (delta.formSubmits) {
    updates.formSubmits = FieldValue.increment(delta.formSubmits);
  }
  if (delta.formAbandonments) {
    updates.formAbandonments = FieldValue.increment(delta.formAbandonments);
  }
  if (delta.formErrors) updates.formErrors = FieldValue.increment(delta.formErrors);
  if (delta.apiErrors) updates.apiErrors = FieldValue.increment(delta.apiErrors);
  if (typeof durationSeconds === "number" && durationSeconds > 0) {
    updates.totalSessionSeconds = FieldValue.increment(durationSeconds);
  }

  tx.set(ref, updates, { merge: true });

  if (delta.pathIncrement) {
    tx.set(
      ref,
      {
        byPath: {
          [delta.pathIncrement]: FieldValue.increment(1),
        },
      },
      { merge: true },
    );
  }
}

function sessionUpdatesFromEvent(
  input: PublicAnalyticsIngestInput,
  existing: FirebaseFirestore.DocumentData | undefined,
  deviceClass: "mobile" | "desktop",
): Record<string, unknown> {
  const now = FieldValue.serverTimestamp();
  const meta = input.meta ?? {};
  const updates: Record<string, unknown> = {
    sessionId: input.sessionId,
    lastSeenAt: now,
    lastPath: input.path,
    locale: input.locale,
    deviceClass,
    updatedAt: now,
  };

  if (!existing) {
    updates.createdAt = now;
    updates.firstPath = input.path;
    updates.pageViewCount = 0;
    updates.durationSeconds = 0;
  }

  if (input.action === "page.view") {
    updates.pageViewCount = FieldValue.increment(1);
  }

  if (input.action === "session.heartbeat") {
    const prevDuration = num(existing?.durationSeconds);
    const heartbeatSec =
      typeof meta.durationSeconds === "number" ? meta.durationSeconds : 60;
    updates.durationSeconds = prevDuration + heartbeatSec;
  }

  if (input.action === "form.start") {
    updates.formActive = true;
    if (isPublicFormType(meta.formType)) {
      updates.formType = meta.formType;
    }
    if (typeof meta.step === "string") {
      updates.lastFormStep = meta.step;
    }
  }

  if (input.action === "form.step") {
    updates.formActive = true;
    if (isPublicFormType(meta.formType)) {
      updates.formType = meta.formType;
    }
    if (typeof meta.step === "string") {
      updates.lastFormStep = meta.step;
    }
    if (typeof meta.officeId === "string") {
      updates.officeId = meta.officeId;
    }
    if (typeof meta.maskedPhone === "string") {
      updates.maskedPhone = meta.maskedPhone;
    }
    if (typeof meta.preferredDate === "string") {
      updates.preferredDate = meta.preferredDate;
    }
  }

  if (input.action === "form.submit_error") {
    updates.formActive = true;
    if (typeof meta.officeId === "string") {
      updates.officeId = meta.officeId;
    }
    if (typeof meta.maskedPhone === "string") {
      updates.maskedPhone = meta.maskedPhone;
    }
    if (typeof meta.preferredDate === "string") {
      updates.preferredDate = meta.preferredDate;
    }
    if (typeof meta.step === "string") {
      updates.lastFormStep = meta.step;
    }
  }

  if (
    input.action === "form.submit_success" ||
    input.action === "form.abandon"
  ) {
    updates.formActive = false;
  }

  if (input.action === "form.abandon") {
    updates.endedAt = now;
  }

  return updates;
}

export async function ingestPublicAnalyticsEvent(
  input: PublicAnalyticsIngestInput,
  options?: { userAgent?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, error: "firebase_unconfigured" };
  }

  const db = getAdminDb();
  const deviceClass =
    input.deviceClass ?? deviceClassFromUserAgent(options?.userAgent ?? null);
  const date = getCairoTodayYmd();
  const sessionRef = db.collection(PUBLIC_SESSIONS).doc(input.sessionId);

  try {
    await db.runTransaction(async (tx) => {
      const sessionSnap = await tx.get(sessionRef);
      const existing = sessionSnap.exists ? sessionSnap.data() : undefined;
      const { delta: statsDelta, sessionFields: statsSessionFields } =
        computeDailyStatsDelta(input, existing, date);

      tx.set(
        sessionRef,
        {
          ...sessionUpdatesFromEvent(input, existing, deviceClass),
          ...statsSessionFields,
        },
        { merge: true },
      );

      if (shouldPersistPublicAnalyticsEvent(input.action)) {
        tx.set(db.collection(PUBLIC_EVENTS).doc(), {
          sessionId: input.sessionId,
          action: input.action,
          path: input.path,
          locale: input.locale,
          ...(input.meta ? { meta: input.meta } : {}),
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      const durationDelta =
        input.action === "session.heartbeat" &&
        typeof input.meta?.durationSeconds === "number"
          ? input.meta.durationSeconds
          : undefined;

      applyDailyStatsDelta(tx, date, statsDelta, durationDelta);
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "ingest_failed" };
  }
}

export async function logPublicFormSubmitError(args: {
  sessionId?: string;
  path: string;
  locale: string;
  formType: PublicFormType;
  errorCode: string;
  officeId?: string;
  phone?: string;
  preferredDate?: string;
  requestId?: string;
}): Promise<void> {
  if (!args.sessionId) return;
  const meta: Record<string, unknown> = {
    formType: args.formType,
    errorCode: args.errorCode,
    step: "submit",
  };
  if (args.officeId) meta.officeId = args.officeId;
  if (args.phone) meta.maskedPhone = maskPhoneForAnalytics(args.phone);
  if (args.preferredDate) meta.preferredDate = args.preferredDate;
  if (args.requestId) meta.requestId = args.requestId;

  await ingestPublicAnalyticsEvent({
    sessionId: args.sessionId,
    action: "form.submit_error",
    path: args.path,
    locale: args.locale as PublicAnalyticsIngestInput["locale"],
    meta,
  });
}

export async function listActivePublicSessions(
  limit = 50,
): Promise<PublicSessionRecord[]> {
  if (!isFirebaseAdminConfigured()) return [];
  const cutoff = Timestamp.fromMillis(Date.now() - ACTIVE_SESSION_WINDOW_MS);
  const snap = await getAdminDb()
    .collection(PUBLIC_SESSIONS)
    .where("lastSeenAt", ">=", cutoff)
    .orderBy("lastSeenAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((doc) => sessionFromDoc(doc.id, doc.data()));
}

export async function listDailyPublicStatsInRange(
  fromYmd: string,
  toYmd: string,
): Promise<DailyPublicStats[]> {
  if (!isFirebaseAdminConfigured()) return [];
  const db = getAdminDb();
  const refs = await db
    .collection(DAILY_PUBLIC_STATS)
    .where("date", ">=", fromYmd)
    .where("date", "<=", toYmd)
    .orderBy("date", "asc")
    .get();
  return refs.docs.map((doc) => parseDailyPublicStats(doc.id, doc.data()));
}

export async function listRecentProblemEvents(args: {
  from: Date;
  limit?: number;
}): Promise<PublicProblemEvent[]> {
  if (!isFirebaseAdminConfigured()) return [];
  const limit = args.limit ?? 40;
  const snap = await getAdminDb()
    .collection(PUBLIC_EVENTS)
    .where("createdAt", ">=", Timestamp.fromDate(args.from))
    .orderBy("createdAt", "desc")
    .limit(limit * 3)
    .get();

  const problemActions = new Set([
    "form.submit_error",
    "form.abandon",
    "api.error",
  ]);

  const items: PublicProblemEvent[] = [];
  for (const doc of snap.docs) {
    const event = eventFromDoc(doc.id, doc.data());
    if (!problemActions.has(event.action)) continue;
    items.push({
      ...event,
      summaryAr: problemEventSummaryAr(event),
    });
    if (items.length >= limit) break;
  }
  return items;
}

export async function listAbandonedFormSessions(
  limit = 30,
): Promise<PublicSessionRecord[]> {
  if (!isFirebaseAdminConfigured()) return [];
  const snap = await getAdminDb()
    .collection(PUBLIC_SESSIONS)
    .where("formActive", "==", true)
    .orderBy("lastSeenAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((doc) => sessionFromDoc(doc.id, doc.data()));
}

function problemEventSummaryAr(event: PublicEventRecord): string {
  const meta = event.meta ?? {};
  const formType = String(meta.formType ?? "نموذج");
  switch (event.action) {
    case "form.submit_error":
      return `فشل إرسال ${formTypeLabel(formType)} — ${String(meta.errorCode ?? "خطأ")}`;
    case "form.abandon":
      return `ترك ${formTypeLabel(formType)} قبل الإرسال${meta.step ? ` (آخر خطوة: ${meta.step})` : ""}`;
    case "api.error":
      return `خطأ اتصال — ${String(meta.errorCode ?? "api")}`;
    default:
      return event.action;
  }
}

function formTypeLabel(formType: string): string {
  if (formType === "booking") return "حجز";
  if (formType === "complaint") return "شكوى";
  if (formType === "checkin") return "تسجيل حضور";
  return formType;
}

export async function buildPlatformInsightsSnapshot(args: {
  fromYmd: string;
  toYmd: string;
}): Promise<PlatformInsightsSnapshot> {
  const today = getCairoTodayYmd();
  const [activeSessions, dailyRows, problemEvents, abandonedSessions] =
    await Promise.all([
      listActivePublicSessions(50),
      listDailyPublicStatsInRange(args.fromYmd, args.toYmd),
      listRecentProblemEvents({
        from: new Date(`${args.fromYmd}T00:00:00+02:00`),
        limit: 40,
      }),
      listAbandonedFormSessions(30),
    ]);

  const todayRow =
    dailyRows.find((r) => r.date === today) ?? emptyDailyStats(today);
  const rangeStats = aggregateDailyPublicStats(
    dailyRows.length > 0 ? dailyRows : [emptyDailyStats(args.fromYmd)],
  );

  const topPaths = Object.entries(rangeStats.byPath)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  return {
    activeSessions,
    activeCount: activeSessions.length,
    todayStats: todayRow,
    rangeStats,
    topPaths,
    problemEvents,
    abandonedSessions,
  };
}

export async function probeFirestoreHealth(): Promise<{
  configured: boolean;
  readOk: boolean;
  writeOk: boolean;
}> {
  if (!isFirebaseAdminConfigured()) {
    return { configured: false, readOk: false, writeOk: false };
  }
  const db = getAdminDb();
  const probeRef = db.collection(DAILY_PUBLIC_STATS).doc("_health_probe");
  try {
    await probeRef.get();
    await probeRef.set(
      { lastProbeAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return { configured: true, readOk: true, writeOk: true };
  } catch {
    return { configured: true, readOk: false, writeOk: false };
  }
}

export function shouldArchivePublicEventData(
  data: Record<string, unknown>,
  cutoff: Date,
): boolean {
  const value = data.createdAt;
  if (value instanceof Timestamp) {
    return value.toMillis() < cutoff.getTime();
  }
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) && ms < cutoff.getTime();
  }
  return false;
}

export async function archiveOldPublicEvents(args: {
  archiveBefore: Date;
  archivedAt: Timestamp;
  maxDocs: number;
}): Promise<{ archived: number; truncated: boolean }> {
  if (!isFirebaseAdminConfigured()) {
    return { archived: 0, truncated: false };
  }
  const db = getAdminDb();
  const snap = await db
    .collection(PUBLIC_EVENTS)
    .where("createdAt", "<", Timestamp.fromDate(args.archiveBefore))
    .orderBy("createdAt", "asc")
    .limit(args.maxDocs)
    .get();

  if (snap.empty) return { archived: 0, truncated: false };

  let batch = db.batch();
  let ops = 0;
  let archived = 0;

  for (const doc of snap.docs) {
    const archiveRef = db.collection(PUBLIC_EVENTS_ARCHIVE).doc(doc.id);
    batch.set(archiveRef, {
      ...doc.data(),
      archivedAt: args.archivedAt,
      sourceCollection: PUBLIC_EVENTS,
      sourceId: doc.id,
    });
    batch.delete(doc.ref);
    ops += 2;
    archived += 1;
    if (ops >= 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();

  return { archived, truncated: snap.size >= args.maxDocs };
}

export async function deleteStalePublicSessions(args: {
  staleBefore: Date;
  maxDocs: number;
}): Promise<{ deleted: number; truncated: boolean }> {
  if (!isFirebaseAdminConfigured()) {
    return { deleted: 0, truncated: false };
  }
  const db = getAdminDb();
  const snap = await db
    .collection(PUBLIC_SESSIONS)
    .where("lastSeenAt", "<", Timestamp.fromDate(args.staleBefore))
    .orderBy("lastSeenAt", "asc")
    .limit(args.maxDocs)
    .get();

  if (snap.empty) return { deleted: 0, truncated: false };

  let batch = db.batch();
  let ops = 0;
  let deleted = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    ops += 1;
    deleted += 1;
    if (ops >= 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();
  return { deleted, truncated: snap.size >= args.maxDocs };
}

export async function deleteExpiredPublicEventArchives(args: {
  deleteBefore: Date;
  maxDocs: number;
}): Promise<{ deleted: number; truncated: boolean }> {
  if (!isFirebaseAdminConfigured()) {
    return { deleted: 0, truncated: false };
  }
  const db = getAdminDb();
  const snap = await db
    .collection(PUBLIC_EVENTS_ARCHIVE)
    .where("archivedAt", "<", Timestamp.fromDate(args.deleteBefore))
    .orderBy("archivedAt", "asc")
    .limit(args.maxDocs)
    .get();

  if (snap.empty) return { deleted: 0, truncated: false };

  let batch = db.batch();
  let ops = 0;
  let deleted = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    ops += 1;
    deleted += 1;
    if (ops >= 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();
  return { deleted, truncated: snap.size >= args.maxDocs };
}

export { aggregateDailyPublicStats, countActiveSessions } from "@/lib/analytics/public-event-schema";
