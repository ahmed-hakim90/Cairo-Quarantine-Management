import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { SUPER_ADMIN_EXPORT_MAX_ROWS } from "@/lib/office-requests/export-limits";
import { SUPER_ADMIN_DATA_COLLECTION_PATHS } from "@/lib/office-requests/super-admin-data-constants";
import type {
  SuperAdminDataCollectionKey,
  SuperAdminPurgableCollectionKey,
} from "@/lib/office-requests/super-admin-data-constants";
import type { OfficeRequestType } from "@/lib/office-requests/types";

export type {
  SuperAdminDataCollectionKey,
  SuperAdminPurgableCollectionKey,
  SuperAdminPurgeOperationId,
} from "@/lib/office-requests/super-admin-data-constants";

export {
  EXPORT_FILE_STEM_AR,
  isSuperAdminDataCollectionKey,
  isSuperAdminPurgableCollectionKey,
  isSuperAdminPurgeOperationId,
  SUPER_ADMIN_DATA_COLLECTION_PATHS,
  SUPER_ADMIN_PURGE_CONFIRM_PHRASE,
  SUPER_ADMIN_PURGE_OPERATIONS,
  SUPER_ADMIN_PURGABLE_COLLECTION_KEYS,
} from "@/lib/office-requests/super-admin-data-constants";

const VALID_REQUEST_TYPES = new Set<OfficeRequestType>([
  "booking",
  "complaint",
  "proposal",
]);

const TS_MARKER = "__cqmFirestoreTimestampMs";

function serializeFirestoreValue(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return { [TS_MARKER]: value.toMillis() };
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      out[k] = serializeFirestoreValue(v);
    }
    return out;
  }
  if (Array.isArray(value)) {
    return value.map((v) => serializeFirestoreValue(v));
  }
  return value;
}

function deserializeFirestoreValue(value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    if (
      Object.keys(o).length === 1 &&
      typeof o[TS_MARKER] === "number" &&
      Number.isFinite(o[TS_MARKER])
    ) {
      return Timestamp.fromMillis(o[TS_MARKER] as number);
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      out[k] = deserializeFirestoreValue(v);
    }
    return out;
  }
  if (Array.isArray(value)) {
    return value.map((v) => deserializeFirestoreValue(v));
  }
  return value;
}

export function buildNdjsonExportForCollection(args: {
  collectionKey: SuperAdminDataCollectionKey;
  maxDocs: number;
}): Promise<{ ndjson: string; docCount: number; capped: boolean }> {
  if (!isFirebaseAdminConfigured()) {
    return Promise.reject(new Error("خدمة التخزين غير مهيأة حالياً."));
  }
  const path = SUPER_ADMIN_DATA_COLLECTION_PATHS[args.collectionKey];
  const max = Math.min(
    Math.max(1, args.maxDocs),
    SUPER_ADMIN_EXPORT_MAX_ROWS,
  );
  return (async () => {
    const snap = await getAdminDb().collection(path).limit(max + 1).get();
    const capped = snap.size > max;
    const docs = snap.docs.slice(0, max);
    const lines = docs.map((d) =>
      JSON.stringify({
        id: d.id,
        data: serializeFirestoreValue(d.data() ?? {}),
      }),
    );
    return {
      ndjson: lines.join("\n") + (lines.length ? "\n" : ""),
      docCount: lines.length,
      capped,
    };
  })();
}

function toStoredScalar(value: unknown): string | Timestamp {
  if (value instanceof Timestamp) return value;
  const s = String(value ?? "").trim();
  if (!s) throw new Error("تاريخ أو وقت فارغ في الطلب.");
  return s;
}

function assertValidRequestImportData(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const data = deserializeFirestoreValue(raw) as Record<string, unknown>;
  const officeId = String(data.officeId ?? "").trim();
  const officeNameAr = String(data.officeNameAr ?? "").trim();
  const type = String(data.type ?? "");
  const name = String(data.name ?? "").trim();
  const phone = String(data.phone ?? "").trim();
  const details = String(data.details ?? "");
  const notes = String(data.notes ?? "");
  const status = String(data.status ?? "new");
  let createdAt: string | Timestamp;
  let updatedAt: string | Timestamp;
  try {
    createdAt = toStoredScalar(data.createdAt);
    updatedAt = toStoredScalar(data.updatedAt);
  } catch {
    throw new Error("تاريخ الإنشاء وتاريخ آخر تحديث مطلوبان في كل طلب.");
  }

  if (!officeId) throw new Error("بيانات المكتب المرتبط بالطلب ناقصة.");
  if (!officeNameAr) throw new Error("اسم المكتب بالعربية ناقص في الطلب.");
  if (!VALID_REQUEST_TYPES.has(type as OfficeRequestType)) {
    throw new Error("نوع الطلب غير صالح.");
  }
  if (!name) throw new Error("اسم مقدّم الطلب ناقص.");
  if (!phone) throw new Error("رقم الهاتف ناقص في الطلب.");

  const out: Record<string, unknown> = {
    officeId,
    officeNameAr,
    type,
    name,
    phone,
    details,
    notes,
    status,
    createdAt,
    updatedAt,
  };

  if (data.travelerStateId != null && String(data.travelerStateId).trim()) {
    out.travelerStateId = String(data.travelerStateId).trim();
  }
  if (data.travelerCategory != null && String(data.travelerCategory).trim()) {
    out.travelerCategory = String(data.travelerCategory).trim();
  }
  if (data.preferredDate != null && String(data.preferredDate).trim()) {
    out.preferredDate = String(data.preferredDate).trim();
  }
  if (data.passToken != null && String(data.passToken).trim()) {
    out.passToken = String(data.passToken).trim();
  }
  if (data.lastWhatsappAt != null) {
    if (data.lastWhatsappAt instanceof Timestamp) {
      out.lastWhatsappAt = data.lastWhatsappAt;
    } else {
      const s = String(data.lastWhatsappAt).trim();
      if (s) out.lastWhatsappAt = s;
    }
  }

  return out;
}

export async function importDocumentsToCollection(args: {
  collectionKey: SuperAdminDataCollectionKey;
  items: { id: string; data: unknown }[];
}): Promise<{ written: number; errors: string[] }> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("خدمة التخزين غير مهيأة حالياً.");
  }
  const path = SUPER_ADMIN_DATA_COLLECTION_PATHS[args.collectionKey];
  const col = getAdminDb().collection(path);
  const errors: string[] = [];
  const ops: { id: string; payload: Record<string, unknown> }[] = [];

  for (let i = 0; i < args.items.length; i++) {
    const item = args.items[i];
    const id = String(item?.id ?? "").trim();
    if (!id) {
      errors.push(`الصف ${i + 1}: رمز الوثيقة فارغ.`);
      continue;
    }
    try {
      let payload: Record<string, unknown>;
      if (!item.data || typeof item.data !== "object" || Array.isArray(item.data)) {
        throw new Error("محتوى الوثيقة يجب أن يكون نصاً منظّماً وليس قائمة.");
      }
      const raw = item.data as Record<string, unknown>;
      if (args.collectionKey === "requests") {
        payload = assertValidRequestImportData(raw);
      } else {
        payload = deserializeFirestoreValue(raw) as Record<string, unknown>;
      }
      ops.push({ id, payload });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`الصف ${i + 1} (${id}): ${msg}`);
    }
  }

  const db = getAdminDb();
  let written = 0;
  const BATCH = 500;
  for (let i = 0; i < ops.length; i += BATCH) {
    const slice = ops.slice(i, i + BATCH);
    const batch = db.batch();
    for (const op of slice) {
      batch.set(col.doc(op.id), op.payload, { merge: true });
    }
    await batch.commit();
    written += slice.length;
  }

  return { written, errors };
}

/** حذف طلبات تطابق نوعاً واحداً (شكوى أو مقترح) على دفعات. */
export async function purgeRequestsByTypeBatched(args: {
  requestType: "complaint" | "proposal";
  maxDeleted: number;
}): Promise<{ deleted: number; truncated: boolean }> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("خدمة التخزين غير مهيأة حالياً.");
  }
  const col = getAdminDb().collection(SUPER_ADMIN_DATA_COLLECTION_PATHS.requests);
  let deleted = 0;
  let truncated = false;

  while (deleted < args.maxDeleted) {
    const batchSize = Math.min(500, args.maxDeleted - deleted);
    const snap = await col
      .where("type", "==", args.requestType)
      .limit(batchSize)
      .get();
    if (snap.empty) break;

    const batch = getAdminDb().batch();
    for (const d of snap.docs) {
      batch.delete(d.ref);
    }
    await batch.commit();
    deleted += snap.size;

    if (snap.size < batchSize) break;
    if (deleted >= args.maxDeleted) {
      const peek = await col
        .where("type", "==", args.requestType)
        .limit(1)
        .get();
      truncated = !peek.empty;
      break;
    }
  }

  return { deleted, truncated };
}

/** حذف دفعات من المجموعة؛ يتوقف عند الوصول إلى maxDeleted. */
export async function purgeFirestoreCollectionBatched(args: {
  collectionKey: SuperAdminPurgableCollectionKey;
  maxDeleted: number;
}): Promise<{ deleted: number; truncated: boolean }> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("خدمة التخزين غير مهيأة حالياً.");
  }
  const path = SUPER_ADMIN_DATA_COLLECTION_PATHS[args.collectionKey];
  const col = getAdminDb().collection(path);
  let deleted = 0;
  let truncated = false;

  while (deleted < args.maxDeleted) {
    const batchSize = Math.min(500, args.maxDeleted - deleted);
    const snap = await col.limit(batchSize).get();
    if (snap.empty) break;

    const batch = getAdminDb().batch();
    for (const d of snap.docs) {
      batch.delete(d.ref);
    }
    await batch.commit();
    deleted += snap.size;

    if (snap.size < batchSize) break;
    if (deleted >= args.maxDeleted) {
      const peek = await col.limit(1).get();
      truncated = !peek.empty;
      break;
    }
  }

  return { deleted, truncated };
}

export function parseNdjsonImportPayload(text: string): {
  items: { id: string; data: unknown }[];
  parseErrors: string[];
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const items: { id: string; data: unknown }[] = [];
  const parseErrors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      const row = JSON.parse(lines[i]) as { id?: string; data?: unknown };
      const id = String(row?.id ?? "").trim();
      if (!id) {
        parseErrors.push(`سطر ${i + 1}: رمز الوثيقة مفقود.`);
        continue;
      }
      items.push({ id, data: row.data });
    } catch {
      parseErrors.push(`سطر ${i + 1}: تنسيق السطر غير صالح.`);
    }
  }

  return { items, parseErrors };
}

export function parseJsonArrayImportPayload(text: string): {
  items: { id: string; data: unknown }[];
  parseErrors: string[];
} {
  const parseErrors: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { items: [], parseErrors: ["محتوى الملف غير صالح."] };
  }
  if (!Array.isArray(parsed)) {
    return {
      items: [],
      parseErrors: ["توقع قائمة واحدة من البنود (كل بند يحوي رمز الوثيقة ومحتواها)."],
    };
  }
  const items: { id: string; data: unknown }[] = [];
  parsed.forEach((row, i) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      parseErrors.push(`البند ${i + 1}: يجب أن يكون نصاً منظّماً وليس قائمة.`);
      return;
    }
    const r = row as { id?: string; data?: unknown };
    const id = String(r.id ?? "").trim();
    if (!id) {
      parseErrors.push(`البند ${i + 1}: رمز الوثيقة مفقود.`);
      return;
    }
    items.push({ id, data: r.data });
  });
  return { items, parseErrors };
}
