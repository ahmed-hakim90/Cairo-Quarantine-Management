import { randomBytes } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  getAdminAuth,
  isFirebaseAdminConfigured,
  getAdminDb,
} from "@/lib/firebase/admin";
import { passTokensMatch } from "@/lib/booking-pass-token";
import { STATIC_OFFICES } from "@/lib/office-requests/static-offices";
import {
  defaultTravelerStatesFromLegacyLabels,
  effectiveTravelerStateIdOnRequest,
  officeAcceptsTravelerState,
} from "@/lib/office-requests/office-traveler-state";
import { normalizePhone } from "@/lib/office-requests/whatsapp-message";
import {
  DEFAULT_MESSAGE_TEMPLATE,
  REQUEST_STATUS_LABELS,
  type AdminActivityActor,
  type AdminActivityLogAction,
  type AdminActivityLogEntry,
  type AdminUserProfile,
  type MessageTemplate,
  type Office,
  type OfficeRequest,
  type OfficeRequestStatus,
  type OfficeRequestType,
  type AppBookingSettings,
  type BookingPassPublic,
  type CreatedOfficeRequestPublic,
  type PublicOfficeRequestStatus,
  type TravelerCategory,
  type TravelerState,
  type VaccineCatalogEntry,
  type VaccineUserCategory,
  DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR,
} from "@/lib/office-requests/types";
import {
  VACCINES_BY_CATEGORY,
  type UserCategory,
  type VaccineRecord,
} from "@/data/vaccines";
import { SUPER_ADMIN_EXPORT_MAX_ROWS } from "@/lib/office-requests/export-limits";

export { SUPER_ADMIN_EXPORT_MAX_ROWS };

const OFFICES = "offices";
const TRAVELER_STATES = "traveler_states";
const VACCINES = "vaccines";
const REQUESTS = "requests";
const SETTINGS = "settings";
const USERS = "users";
const TEMPLATES = "messageTemplates";
const ACTIVITY_LOGS = "activityLogs";
const SETTINGS_APP_DOC = "app";

const VACCINE_CATEGORIES: VaccineUserCategory[] = [
  "international",
  "hajj",
  "umrah",
  "citizen",
];

function isVaccineUserCategory(value: string): value is VaccineUserCategory {
  return (VACCINE_CATEGORIES as string[]).includes(value);
}

function iso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function activityLogFromDoc(
  id: string,
  data: FirebaseFirestore.DocumentData,
): AdminActivityLogEntry {
  const action = String(data.action ?? "request.updated") as AdminActivityLogAction;
  return {
    id,
    createdAt: iso(data.createdAt),
    actorUid: String(data.actorUid ?? ""),
    actorLabel: String(data.actorLabel ?? ""),
    action,
    summaryAr: String(data.summaryAr ?? ""),
    officeId:
      data.officeId != null && data.officeId !== ""
        ? String(data.officeId)
        : null,
    ...(data.requestId ? { requestId: String(data.requestId) } : {}),
    ...(data.meta &&
    typeof data.meta === "object" &&
    !Array.isArray(data.meta)
      ? { meta: data.meta as Record<string, unknown> }
      : {}),
  };
}

async function appendActivityLog(payload: {
  actor: AdminActivityActor;
  action: AdminActivityLogAction;
  summaryAr: string;
  officeId: string | null;
  requestId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  if (!isFirebaseAdminConfigured()) return;
  try {
    await getAdminDb()
      .collection(ACTIVITY_LOGS)
      .add({
        actorUid: payload.actor.uid,
        actorLabel: payload.actor.label,
        action: payload.action,
        summaryAr: payload.summaryAr,
        officeId: payload.officeId,
        ...(payload.requestId ? { requestId: payload.requestId } : {}),
        ...(payload.meta && Object.keys(payload.meta).length > 0
          ? { meta: payload.meta }
          : {}),
        createdAt: FieldValue.serverTimestamp(),
      });
  } catch {
    /* لا نفشل العملية الرئيسية */
  }
}

function publicRequestStatus(
  request: OfficeRequest,
): PublicOfficeRequestStatus {
  return {
    id: request.id,
    officeNameAr: request.officeNameAr,
    type: request.type,
    ...(request.travelerStateId
      ? { travelerStateId: request.travelerStateId }
      : {}),
    travelerCategory: request.travelerCategory,
    preferredDate: request.preferredDate,
    status: request.status,
    notes: request.notes,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    ...(request.passToken ? { passToken: String(request.passToken) } : {}),
  };
}

function parseDailyBookingCap(raw: unknown): number | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n =
    typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

function clampBookingSameDayHour(hour: number): number {
  return Math.min(23, Math.max(0, Math.floor(hour)));
}

function parseTravelerStateIdsFromDoc(
  data: FirebaseFirestore.DocumentData,
): string[] | undefined {
  const raw = data.travelerStateIds;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const ids = [...new Set(raw.map((x) => String(x).trim()).filter(Boolean))];
  return ids.length > 0 ? ids : undefined;
}

function travelerStateFromDoc(
  id: string,
  data: FirebaseFirestore.DocumentData,
): TravelerState {
  const sortRaw = data.sortOrder;
  const sortOrder =
    typeof sortRaw === "number" && Number.isFinite(sortRaw)
      ? sortRaw
      : 0;
  return {
    id,
    labelAr: String(data.labelAr ?? ""),
    sortOrder,
    active: data.active !== false,
    createdAt: data.createdAt ? iso(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? iso(data.updatedAt) : undefined,
  };
}

function officeFromDoc(id: string, data: FirebaseFirestore.DocumentData): Office {
  const cap = parseDailyBookingCap(data.dailyBookingCap);
  const travelerStateIds = parseTravelerStateIdsFromDoc(data);
  return {
    id,
    administrationAr: String(data.administrationAr ?? ""),
    nameAr: String(data.nameAr ?? ""),
    addressAr: String(data.addressAr ?? ""),
    phone: data.phone ? String(data.phone) : null,
    mapsUrl: String(data.mapsUrl ?? ""),
    service:
      data.service === "hajj_umrah_only"
        ? "hajj_umrah_only"
        : "hajj_umrah_travelers",
    active: data.active !== false,
    ...(travelerStateIds ? { travelerStateIds } : {}),
    ...(cap !== undefined ? { dailyBookingCap: cap } : {}),
    createdAt: data.createdAt ? iso(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? iso(data.updatedAt) : undefined,
  };
}

function vaccineFromDoc(
  id: string,
  data: FirebaseFirestore.DocumentData,
): VaccineCatalogEntry {
  const catRaw = String(data.category ?? "");
  const category: VaccineUserCategory = isVaccineUserCategory(catRaw)
    ? catRaw
    : "international";
  const priceRaw = data.priceEgp;
  const priceEgp =
    priceRaw === null || priceRaw === undefined || priceRaw === ""
      ? null
      : typeof priceRaw === "number"
        ? priceRaw
        : Number(priceRaw);
  return {
    id,
    category,
    nameAr: String(data.nameAr ?? ""),
    nameEn: String(data.nameEn ?? ""),
    priceEgp: Number.isFinite(priceEgp) ? priceEgp : null,
    free: data.free === true,
    sortOrder:
      typeof data.sortOrder === "number" && Number.isFinite(data.sortOrder)
        ? data.sortOrder
        : 0,
    active: data.active !== false,
    createdAt: data.createdAt ? iso(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? iso(data.updatedAt) : undefined,
  };
}

function toVaccineRecord(entry: VaccineCatalogEntry): VaccineRecord {
  return {
    id: entry.id,
    nameAr: entry.nameAr,
    nameEn: entry.nameEn,
    priceEgp: entry.free ? null : entry.priceEgp,
    free: entry.free,
  };
}

function emptyVaccinesByCategory(): Record<UserCategory, VaccineRecord[]> {
  return {
    international: [],
    hajj: [],
    umrah: [],
    citizen: [],
  };
}

function groupActiveVaccinesPublic(
  entries: VaccineCatalogEntry[],
): Record<UserCategory, VaccineRecord[]> {
  const grouped = emptyVaccinesByCategory();
  const active = entries.filter((e) => e.active);
  active.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });
  for (const e of active) {
    if (!grouped[e.category]) continue;
    grouped[e.category].push(toVaccineRecord(e));
  }
  return grouped;
}

export async function listVaccinesByCategoryForPublic(): Promise<
  Record<UserCategory, VaccineRecord[]>
> {
  if (!isFirebaseAdminConfigured()) return VACCINES_BY_CATEGORY;

  try {
    const snap = await getAdminDb().collection(VACCINES).get();
    if (snap.empty) return VACCINES_BY_CATEGORY;

    const entries = snap.docs.map((d) =>
      vaccineFromDoc(d.id, d.data() ?? {}),
    );
    const grouped = groupActiveVaccinesPublic(entries);
    const totalActive = VACCINE_CATEGORIES.reduce(
      (n, c) => n + grouped[c].length,
      0,
    );
    if (totalActive === 0) return VACCINES_BY_CATEGORY;

    return grouped;
  } catch {
    return VACCINES_BY_CATEGORY;
  }
}

export async function listVaccinesForAdmin(options?: {
  includeInactive?: boolean;
}): Promise<VaccineCatalogEntry[]> {
  if (!isFirebaseAdminConfigured()) return [];

  try {
    const snap = await getAdminDb().collection(VACCINES).get();
    let entries = snap.docs.map((d) => vaccineFromDoc(d.id, d.data() ?? {}));
    if (!options?.includeInactive) {
      entries = entries.filter((e) => e.active);
    }
    entries.sort((a, b) => {
      const ci = VACCINE_CATEGORIES.indexOf(a.category);
      const cj = VACCINE_CATEGORIES.indexOf(b.category);
      if (ci !== cj) return ci - cj;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.id.localeCompare(b.id);
    });
    return entries;
  } catch {
    return [];
  }
}

export async function upsertVaccine(
  input: VaccineCatalogEntry,
  actor: AdminActivityActor,
): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن حفظ اللقاح.");
  }

  const id = input.id.trim();
  if (!id) throw new Error("معرّف اللقاح مطلوب.");

  const ref = getAdminDb().collection(VACCINES).doc(id);
  await ref.set(
    {
      category: input.category,
      nameAr: input.nameAr.trim(),
      nameEn: input.nameEn.trim(),
      priceEgp: input.free ? null : input.priceEgp,
      free: input.free,
      sortOrder: input.sortOrder,
      active: input.active,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await appendActivityLog({
    actor,
    action: "vaccine.upserted",
    summaryAr: `حفظ لقاح في الكتالوج: ${input.nameAr.trim()} (${id})`,
    officeId: null,
    meta: { vaccineId: id },
  });
}

export async function setVaccineActive(
  vaccineId: string,
  active: boolean,
  actor: AdminActivityActor,
): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن تحديث اللقاح.");
  }

  const snap = await getAdminDb().collection(VACCINES).doc(vaccineId).get();
  const nameAr = snap.exists
    ? String(snap.data()?.nameAr ?? vaccineId)
    : vaccineId;

  await getAdminDb().collection(VACCINES).doc(vaccineId).update({
    active,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await appendActivityLog({
    actor,
    action: "vaccine.active_changed",
    summaryAr: active
      ? `تفعيل اللقاح في الكتالوج: ${nameAr}`
      : `إيقاف اللقاح في الكتالوج: ${nameAr}`,
    officeId: null,
    meta: { vaccineId, active },
  });
}

export async function listTravelerStates(options?: {
  includeInactive?: boolean;
}): Promise<TravelerState[]> {
  if (!isFirebaseAdminConfigured()) {
    return [];
  }
  try {
    const snap = await getAdminDb().collection(TRAVELER_STATES).get();
    if (snap.empty) return [];
    let list = snap.docs.map((d) =>
      travelerStateFromDoc(d.id, d.data() ?? {}),
    );
    if (!options?.includeInactive) {
      list = list.filter((s) => s.active);
    }
    list.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.id.localeCompare(b.id);
    });
    return list;
  } catch {
    return [];
  }
}

/** للنموذج العام: إن لم توجد وثائق بعد، تُستخدم الحالات الافتراضية الثلاث. */
export async function listTravelerStatesForPublicBooking(): Promise<
  TravelerState[]
> {
  const list = await listTravelerStates({ includeInactive: false });
  if (list.length > 0) return list;
  return defaultTravelerStatesFromLegacyLabels();
}

export function buildTravelerStateLabelById(
  states: TravelerState[],
): Record<string, string> {
  return Object.fromEntries(states.map((s) => [s.id, s.labelAr]));
}

export async function upsertTravelerState(
  input: TravelerState,
  actor: AdminActivityActor,
): Promise<string> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن حفظ الحالة.");
  }

  const id = input.id.trim();
  if (!id || id === "new") {
    throw new Error("معرّف حالة المسافر غير صالح.");
  }

  const ref = getAdminDb().collection(TRAVELER_STATES).doc(id);
  const existed = (await ref.get()).exists;

  await ref.set(
    {
      labelAr: input.labelAr.trim(),
      sortOrder: input.sortOrder,
      active: input.active,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await appendActivityLog({
    actor,
    action: "traveler_state.upserted",
    summaryAr: existed
      ? `تحديث حالة مسافر: ${input.labelAr.trim()}`
      : `إضافة حالة مسافر: ${input.labelAr.trim()}`,
    officeId: null,
    meta: { travelerStateId: ref.id },
  });

  return ref.id;
}

export async function setTravelerStateActive(
  travelerStateId: string,
  active: boolean,
  actor: AdminActivityActor,
): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن تحديث الحالة.");
  }

  const snap = await getAdminDb()
    .collection(TRAVELER_STATES)
    .doc(travelerStateId)
    .get();
  const labelAr = snap.exists
    ? String(snap.data()?.labelAr ?? travelerStateId)
    : travelerStateId;

  await getAdminDb().collection(TRAVELER_STATES).doc(travelerStateId).update({
    active,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await appendActivityLog({
    actor,
    action: "traveler_state.active_changed",
    summaryAr: active
      ? `تفعيل حالة مسافر: ${labelAr}`
      : `تعطيل حالة مسافر: ${labelAr}`,
    officeId: null,
    meta: { travelerStateId, active },
  });
}

function requestFromDoc(
  id: string,
  data: FirebaseFirestore.DocumentData,
): OfficeRequest {
  return {
    id,
    officeId: String(data.officeId ?? ""),
    officeNameAr: String(data.officeNameAr ?? ""),
    type: (data.type ?? "booking") as OfficeRequestType,
    ...(data.travelerStateId
      ? { travelerStateId: String(data.travelerStateId).trim() }
      : {}),
    travelerCategory: data.travelerCategory
      ? (String(data.travelerCategory) as TravelerCategory)
      : undefined,
    preferredDate: data.preferredDate ? String(data.preferredDate) : undefined,
    status: (data.status ?? "new") as OfficeRequestStatus,
    name: String(data.name ?? ""),
    phone: String(data.phone ?? ""),
    details: String(data.details ?? ""),
    notes: String(data.notes ?? ""),
    ...(data.passToken ? { passToken: String(data.passToken) } : {}),
    lastWhatsappAt: data.lastWhatsappAt ? iso(data.lastWhatsappAt) : undefined,
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
  };
}

function profileFromDoc(
  uid: string,
  data: FirebaseFirestore.DocumentData,
): AdminUserProfile {
  return {
    uid,
    email: data.email ? String(data.email) : null,
    displayName: String(data.displayName ?? data.email ?? "مستخدم"),
    role: data.role === "super_admin" ? "super_admin" : "office_user",
    officeId: data.officeId ? String(data.officeId) : null,
    active: data.active !== false,
    createdAt: data.createdAt ? iso(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? iso(data.updatedAt) : undefined,
  };
}

function templateFromDoc(
  id: string,
  data: FirebaseFirestore.DocumentData,
): MessageTemplate {
  return {
    id,
    title: String(data.title ?? "رسالة متابعة"),
    body: String(data.body ?? DEFAULT_MESSAGE_TEMPLATE),
    active: data.active !== false,
    createdAt: data.createdAt ? iso(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? iso(data.updatedAt) : undefined,
  };
}

export async function listOffices(options?: {
  includeInactive?: boolean;
}): Promise<Office[]> {
  if (!isFirebaseAdminConfigured()) return STATIC_OFFICES;

  let offices: Office[];

  try {
    const snap = await getAdminDb().collection(OFFICES).orderBy("nameAr").get();
    offices = snap.docs
      .map((doc) => officeFromDoc(doc.id, doc.data()))
      .filter((office) => options?.includeInactive || office.active);
  } catch {
    return STATIC_OFFICES;
  }

  return offices.length > 0 ? offices : STATIC_OFFICES;
}

export async function getOffice(officeId: string): Promise<Office | null> {
  if (!isFirebaseAdminConfigured()) {
    return STATIC_OFFICES.find((office) => office.id === officeId) ?? null;
  }

  const doc = await getAdminDb().collection(OFFICES).doc(officeId).get();
  if (!doc.exists) return null;
  return officeFromDoc(doc.id, doc.data() ?? {});
}

export async function getBookingSettings(): Promise<AppBookingSettings> {
  const fallback = DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR;
  if (!isFirebaseAdminConfigured()) {
    return { bookingSameDayCutoffHour: fallback };
  }
  try {
    const doc = await getAdminDb()
      .collection(SETTINGS)
      .doc(SETTINGS_APP_DOC)
      .get();
    if (!doc.exists) return { bookingSameDayCutoffHour: fallback };
    const raw = doc.data()?.bookingSameDayCutoffHour;
    const n =
      typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
    if (!Number.isFinite(n)) return { bookingSameDayCutoffHour: fallback };
    return { bookingSameDayCutoffHour: clampBookingSameDayHour(n) };
  } catch {
    return { bookingSameDayCutoffHour: fallback };
  }
}

export async function saveBookingSettings(
  input: AppBookingSettings,
  actor: AdminActivityActor,
): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن حفظ الإعدادات.");
  }
  const prev = await getBookingSettings();
  const hour = clampBookingSameDayHour(input.bookingSameDayCutoffHour);
  await getAdminDb().collection(SETTINGS).doc(SETTINGS_APP_DOC).set(
    {
      bookingSameDayCutoffHour: hour,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await appendActivityLog({
    actor,
    action: "settings.booking_updated",
    summaryAr: `قطع حجز اليوم نفسه: من الساعة ${prev.bookingSameDayCutoffHour} إلى ${hour}`,
    officeId: null,
    meta: {
      prevHour: prev.bookingSameDayCutoffHour,
      nextHour: hour,
    },
  });
}

/** All booking-type requests for that office/day (includes cancelled). */
export async function countBookingRequestsForOfficeDay(
  officeId: string,
  preferredDate: string,
): Promise<number> {
  if (!isFirebaseAdminConfigured()) return 0;
  const snap = await getAdminDb()
    .collection(REQUESTS)
    .where("officeId", "==", officeId)
    .where("preferredDate", "==", preferredDate)
    .where("type", "==", "booking")
    .get();
  return snap.size;
}

export async function createOfficeRequest(input: {
  officeId: string;
  type: OfficeRequestType;
  travelerStateId?: string;
  travelerCategory?: TravelerCategory;
  preferredDate?: string;
  name: string;
  phone: string;
  details: string;
}): Promise<CreatedOfficeRequestPublic> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن حفظ الطلب.");
  }

  const office = await getOffice(input.officeId);
  if (!office?.active) throw new Error("المكتب المختار غير متاح.");

  if (input.type === "booking") {
    const sid = input.travelerStateId?.trim();
    if (sid && !officeAcceptsTravelerState(office, sid)) {
      throw new Error(
        "هذا المكتب لا يخدم حالة المسافر المختارة. اختر مكتباً آخر.",
      );
    }
  }

  if (input.type === "booking" && input.preferredDate) {
    const cap = office.dailyBookingCap;
    if (typeof cap === "number" && cap > 0) {
      const used = await countBookingRequestsForOfficeDay(
        office.id,
        input.preferredDate,
      );
      if (used >= cap) {
        throw new Error(
          "لا يمكن الحجز في هذا اليوم؛ تم بلوغ العدد المسموح لهذا المكتب.",
        );
      }
    }
  }

  const passToken = randomBytes(24).toString("base64url");
  const now = FieldValue.serverTimestamp();
  const travelerStateId = input.travelerStateId?.trim();
  const doc = await getAdminDb().collection(REQUESTS).add({
    officeId: office.id,
    officeNameAr: office.nameAr,
    type: input.type,
    ...(travelerStateId ? { travelerStateId } : {}),
    ...(input.travelerCategory && !travelerStateId
      ? { travelerCategory: input.travelerCategory }
      : {}),
    ...(input.preferredDate ? { preferredDate: input.preferredDate } : {}),
    status: "new",
    name: input.name.trim(),
    phone: normalizePhone(input.phone),
    details: input.details.trim(),
    notes: "",
    passToken,
    createdAt: now,
    updatedAt: now,
  });

  const saved = await doc.get();
  const full = requestFromDoc(doc.id, saved.data() ?? {});
  return {
    ...publicRequestStatus(full),
    passToken,
  };
}

export async function getBookingPassPublic(args: {
  id: string;
  token: string;
}): Promise<BookingPassPublic | null> {
  if (!isFirebaseAdminConfigured()) return null;

  const id = args.id.trim();
  const token = args.token.trim();
  if (!id || !token) return null;

  let doc: FirebaseFirestore.DocumentSnapshot;
  try {
    doc = await getAdminDb().collection(REQUESTS).doc(id).get();
  } catch {
    return null;
  }

  if (!doc.exists) return null;
  const data = doc.data() ?? {};
  const stored = data.passToken ? String(data.passToken) : "";
  if (!passTokensMatch(stored, token)) return null;

  const request = requestFromDoc(doc.id, data);
  return {
    id: request.id,
    officeNameAr: request.officeNameAr,
    type: request.type,
    ...(request.travelerStateId
      ? { travelerStateId: request.travelerStateId }
      : {}),
    travelerCategory: request.travelerCategory,
    preferredDate: request.preferredDate,
    status: request.status,
    name: request.name,
    details: request.details,
    notes: request.notes,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

export async function getPublicRequestStatus(args: {
  id: string;
  phone: string;
}): Promise<PublicOfficeRequestStatus | null> {
  if (!isFirebaseAdminConfigured()) return null;

  const id = args.id.trim();
  const phone = normalizePhone(args.phone);
  if (!id || !phone) return null;

  let doc: FirebaseFirestore.DocumentSnapshot;

  try {
    doc = await getAdminDb().collection(REQUESTS).doc(id).get();
    if (!doc.exists) return null;
  } catch {
    return null;
  }

  const request = requestFromDoc(doc.id, doc.data() ?? {});
  if (normalizePhone(request.phone) !== phone) return null;

  return publicRequestStatus(request);
}

export async function listRequestsForSession(args: {
  role: "super_admin" | "office_user";
  officeId: string | null;
  status?: OfficeRequestStatus | "all";
  type?: OfficeRequestType | "all";
  officeFilter?: string;
}): Promise<OfficeRequest[]> {
  if (!isFirebaseAdminConfigured()) return [];

  let query: FirebaseFirestore.Query = getAdminDb().collection(REQUESTS);
  if (args.role === "office_user") {
    if (!args.officeId) return [];
    query = query.where("officeId", "==", args.officeId);
  } else if (args.officeFilter) {
    query = query.where("officeId", "==", args.officeFilter);
  }
  if (args.status && args.status !== "all") {
    query = query.where("status", "==", args.status);
  }
  if (args.type && args.type !== "all") {
    query = query.where("type", "==", args.type);
  }

  const snap = await query.orderBy("createdAt", "desc").limit(200).get();
  return snap.docs.map((doc) => requestFromDoc(doc.id, doc.data()));
}

const EXPORT_PAGE_SIZE = 400;

const ALL_REQUEST_TYPES: readonly OfficeRequestType[] = [
  "booking",
  "complaint",
  "proposal",
];

export type SuperAdminExportFilters = {
  /** فارغ = كل الأنواع */
  types: OfficeRequestType[];
  /** null أو غير مُمرَّر = كل المكاتب */
  officeId: string | null;
  /** تصفية حجوزات حسب `travelerStateId` أو `travelerCategory` القديمة (نفس المعرّف). */
  travelerStateIds: string[];
  /** @deprecated استخدم `travelerStateIds`؛ يُدمَج معه في التصفية */
  travelerCategories: TravelerCategory[];
  includeUncategorizedBookings: boolean;
  /** تصفية على createdAt (شامل)؛ null = بدون حد */
  createdFrom: Timestamp | null;
  createdTo: Timestamp | null;
};

function requestMatchesSuperAdminExport(
  request: OfficeRequest,
  filters: SuperAdminExportFilters,
): boolean {
  const typesSet = new Set(
    filters.types.length > 0 ? filters.types : ALL_REQUEST_TYPES,
  );
  if (!typesSet.has(request.type)) return false;

  const mergedStateKeys = new Set([
    ...filters.travelerStateIds,
    ...filters.travelerCategories,
  ]);

  const travelerFilterActive =
    mergedStateKeys.size > 0 || filters.includeUncategorizedBookings;

  if (request.type !== "booking" || !travelerFilterActive) return true;

  const effective = effectiveTravelerStateIdOnRequest(request);
  if (mergedStateKeys.size > 0 && effective && mergedStateKeys.has(effective)) {
    return true;
  }
  if (filters.includeUncategorizedBookings && !effective) {
    return true;
  }
  return false;
}

/**
 * جلب طلبات للتصدير (بعد التحقق من الجلسة في الـ API: سوبر أدمن أو مستخدم مكتب).
 * يتجاوز حد الـ200 مع تصفح صفحات Firestore.
 */
export async function listRequestsForSuperAdminExport(
  filters: SuperAdminExportFilters,
): Promise<{ requests: OfficeRequest[]; capped: boolean }> {
  if (!isFirebaseAdminConfigured()) {
    return { requests: [], capped: false };
  }

  const collected: OfficeRequest[] = [];
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let capped = false;

  while (collected.length < SUPER_ADMIN_EXPORT_MAX_ROWS) {
    let q: FirebaseFirestore.Query = getAdminDb().collection(REQUESTS);
    if (filters.officeId) {
      q = q.where("officeId", "==", filters.officeId);
    }
    if (filters.createdFrom) {
      q = q.where("createdAt", ">=", filters.createdFrom);
    }
    if (filters.createdTo) {
      q = q.where("createdAt", "<=", filters.createdTo);
    }
    q = q.orderBy("createdAt", "desc").limit(EXPORT_PAGE_SIZE);
    if (lastDoc) {
      q = q.startAfter(lastDoc);
    }

    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      const request = requestFromDoc(doc.id, doc.data());
      if (requestMatchesSuperAdminExport(request, filters)) {
        collected.push(request);
        if (collected.length >= SUPER_ADMIN_EXPORT_MAX_ROWS) {
          capped = true;
          break;
        }
      }
    }

    lastDoc = snap.docs[snap.docs.length - 1] ?? null;
    if (snap.size < EXPORT_PAGE_SIZE) break;
    if (capped) break;
  }

  return { requests: collected, capped };
}

export async function getRequestForSession(args: {
  id: string;
  role: "super_admin" | "office_user";
  officeId: string | null;
}) {
  if (!isFirebaseAdminConfigured()) return null;

  const doc = await getAdminDb().collection(REQUESTS).doc(args.id).get();
  if (!doc.exists) return null;

  const request = requestFromDoc(doc.id, doc.data() ?? {});
  if (args.role === "office_user" && request.officeId !== args.officeId) {
    return null;
  }
  return request;
}

/** حذف نهائي للطلب — سوبر أدمن فقط من الطبقة التي تستدعي؛ بدون سجل نشاط جديد. */
export async function deleteOfficeRequestBySuperAdmin(
  requestId: string,
): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("خدمة التخزين غير مهيأة حالياً، لا يمكن الحذف.");
  }
  const id = requestId.trim();
  if (!id) throw new Error("رمز الطلب مطلوب.");

  const ref = getAdminDb().collection(REQUESTS).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("الطلب غير موجود.");

  await ref.delete();
}

export async function updateRequestForSession(args: {
  id: string;
  role: "super_admin" | "office_user";
  officeId: string | null;
  status: OfficeRequestStatus;
  notes: string;
  actor: AdminActivityActor;
}) {
  const request = await getRequestForSession(args);
  if (!request) throw new Error("الطلب غير موجود أو غير مصرح.");

  await getAdminDb().collection(REQUESTS).doc(args.id).update({
    status: args.status,
    notes: args.notes.trim(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const notesChanged = args.notes.trim() !== request.notes;
  const statusChanged = args.status !== request.status;
  let summaryAr = "تحديث الطلب";
  if (statusChanged && notesChanged) {
    summaryAr = `تغيير الحالة من «${REQUEST_STATUS_LABELS[request.status]}» إلى «${REQUEST_STATUS_LABELS[args.status]}» وتحديث الملاحظات`;
  } else if (statusChanged) {
    summaryAr = `تغيير حالة الطلب من «${REQUEST_STATUS_LABELS[request.status]}» إلى «${REQUEST_STATUS_LABELS[args.status]}»`;
  } else if (notesChanged) {
    summaryAr = "تحديث ملاحظات الطلب";
  }

  await appendActivityLog({
    actor: args.actor,
    action: "request.updated",
    summaryAr,
    officeId: request.officeId,
    requestId: args.id,
    meta: {
      prevStatus: request.status,
      nextStatus: args.status,
    },
  });
}

export async function markWhatsappSentForSession(args: {
  id: string;
  role: "super_admin" | "office_user";
  officeId: string | null;
  actor: AdminActivityActor;
}) {
  const request = await getRequestForSession(args);
  if (!request) throw new Error("الطلب غير موجود أو غير مصرح.");

  await getAdminDb().collection(REQUESTS).doc(args.id).update({
    status: "contacted",
    lastWhatsappAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await appendActivityLog({
    actor: args.actor,
    action: "request.whatsapp_marked",
    summaryAr: `تسجيل إرسال واتساب — الحالة «${REQUEST_STATUS_LABELS.contacted}»`,
    officeId: request.officeId,
    requestId: args.id,
  });
}

export async function getUserProfile(
  uid: string,
): Promise<AdminUserProfile | null> {
  if (!isFirebaseAdminConfigured()) return null;

  const doc = await getAdminDb().collection(USERS).doc(uid).get();
  if (!doc.exists) return null;
  return profileFromDoc(uid, doc.data() ?? {});
}

export async function listUserProfiles(): Promise<AdminUserProfile[]> {
  if (!isFirebaseAdminConfigured()) return [];

  const snap = await getAdminDb().collection(USERS).orderBy("displayName").get();
  return snap.docs.map((doc) => profileFromDoc(doc.id, doc.data()));
}

export async function upsertUserProfile(input: AdminUserProfile) {
  await getAdminDb()
    .collection(USERS)
    .doc(input.uid)
    .set(
      {
        email: input.email,
        displayName: input.displayName,
        role: input.role,
        officeId: input.role === "office_user" ? input.officeId : null,
        active: input.active,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

function activeSuperAdminCount(profiles: AdminUserProfile[]): number {
  return profiles.filter((p) => p.role === "super_admin" && p.active).length;
}

function assertLeavesActiveSuperAdmin(profiles: AdminUserProfile[]) {
  if (activeSuperAdminCount(profiles) < 1) {
    throw new Error(
      "يجب أن يبقى سوبر أدمن نشط واحد على الأقل في النظام.",
    );
  }
}

export async function upsertAdminUserAccount(input: {
  actor: AdminActivityActor;
  uid?: string;
  email: string;
  password?: string;
  displayName: string;
  role: AdminUserProfile["role"];
  officeId: string | null;
  active: boolean;
}): Promise<AdminUserProfile> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن حفظ المستخدم.");
  }

  const email = input.email.trim();
  const displayName = input.displayName.trim() || email;
  if (!email) throw new Error("اكتب البريد الإلكتروني.");
  if (!input.uid && (!input.password || input.password.length < 6)) {
    throw new Error("اكتب كلمة مرور لا تقل عن 6 أحرف للمستخدم الجديد.");
  }
  if (input.uid && input.password && input.password.length < 6) {
    throw new Error("كلمة المرور يجب ألا تقل عن 6 أحرف.");
  }

  const all = await listUserProfiles();
  const role = input.role;
  const active = input.active;

  if (input.uid && input.uid === input.actor.uid) {
    if (!active) {
      throw new Error("لا يمكن إيقاف حسابك الحالي.");
    }
    if (role !== "super_admin") {
      throw new Error("لا يمكن إزالة صلاحيات سوبر أدمن عن نفسك.");
    }
  }

  const nextProfile: AdminUserProfile = {
    uid: input.uid ?? "__new__",
    email,
    displayName,
    role,
    officeId: role === "office_user" ? input.officeId : null,
    active,
  };

  const simulated = input.uid
    ? all.map((p) => (p.uid === input.uid ? nextProfile : p))
    : [...all, nextProfile];

  assertLeavesActiveSuperAdmin(simulated);

  const auth = getAdminAuth();
  const userPayload = {
    email,
    displayName,
    disabled: !input.active,
    ...(input.password ? { password: input.password } : {}),
  };
  const user = input.uid
    ? await auth.updateUser(input.uid, userPayload)
    : await auth.createUser(userPayload);

  const profile: AdminUserProfile = {
    uid: user.uid,
    email,
    displayName,
    role,
    officeId: role === "office_user" ? input.officeId : null,
    active: input.active,
  };

  await upsertUserProfile(profile);

  const isNew = !input.uid;
  await appendActivityLog({
    actor: input.actor,
    action: isNew ? "user.created" : "user.updated",
    summaryAr: isNew
      ? `إنشاء مستخدم إداري: ${displayName} (${email})`
      : `تحديث مستخدم إداري: ${displayName} (${email})`,
    officeId: null,
    meta: {
      targetUid: profile.uid,
      role: profile.role,
      active: profile.active,
    },
  });

  return profile;
}

export async function deleteAdminUserAccount(args: {
  uid: string;
  actor: AdminActivityActor;
}): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن حذف المستخدم.");
  }

  const uid = args.uid.trim();
  if (!uid) throw new Error("معرّف المستخدم مفقود.");

  if (uid === args.actor.uid) {
    throw new Error("لا يمكن حذف حسابك الحالي.");
  }

  const target = await getUserProfile(uid);
  const label =
    target?.displayName && target.email
      ? `${target.displayName} (${target.email})`
      : target?.displayName || target?.email || uid;

  const all = await listUserProfiles();
  const remaining = all.filter((p) => p.uid !== uid);
  assertLeavesActiveSuperAdmin(remaining);

  const auth = getAdminAuth();
  await auth.deleteUser(uid);
  await getAdminDb().collection(USERS).doc(uid).delete();

  await appendActivityLog({
    actor: args.actor,
    action: "user.deleted",
    summaryAr: `حذف مستخدم إداري: ${label}`,
    officeId: null,
    meta: { deletedUid: uid },
  });
}

export async function listMessageTemplates(): Promise<MessageTemplate[]> {
  if (!isFirebaseAdminConfigured()) {
    return [
      {
        id: "default",
        title: "رسالة متابعة افتراضية",
        body: DEFAULT_MESSAGE_TEMPLATE,
        active: true,
      },
    ];
  }

  const snap = await getAdminDb().collection(TEMPLATES).orderBy("title").get();
  const templates = snap.docs.map((doc) => templateFromDoc(doc.id, doc.data()));
  return templates.length > 0
    ? templates
    : [
        {
          id: "default",
          title: "رسالة متابعة افتراضية",
          body: DEFAULT_MESSAGE_TEMPLATE,
          active: true,
        },
      ];
}

export async function upsertMessageTemplate(
  input: MessageTemplate,
  actor: AdminActivityActor,
) {
  const id = input.id === "new" ? undefined : input.id;
  const ref = id
    ? getAdminDb().collection(TEMPLATES).doc(id)
    : getAdminDb().collection(TEMPLATES).doc();

  const existed = id ? (await ref.get()).exists : false;

  await ref.set(
    {
      title: input.title.trim(),
      body: input.body.trim(),
      active: input.active,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const title = input.title.trim();
  await appendActivityLog({
    actor,
    action: existed ? "template.updated" : "template.created",
    summaryAr: existed
      ? `تحديث قالب رسائل: ${title}`
      : `إضافة قالب رسائل: ${title}`,
    officeId: null,
    meta: { templateId: ref.id },
  });
}

export async function deleteMessageTemplate(
  id: string,
  actor: AdminActivityActor,
) {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن حذف القالب.");
  }
  if (!id || id === "default") {
    throw new Error("لا يمكن حذف هذا القالب.");
  }
  const ref = getAdminDb().collection(TEMPLATES).doc(id);
  const snap = await ref.get();
  const title = snap.exists ? String(snap.data()?.title ?? id) : id;
  await ref.delete();

  await appendActivityLog({
    actor,
    action: "template.deleted",
    summaryAr: `حذف قالب رسائل: ${title}`,
    officeId: null,
    meta: { templateId: id },
  });
}

export async function upsertOffice(
  input: Office,
  actor: AdminActivityActor,
): Promise<string> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن حفظ المكتب.");
  }

  const isNew = !input.id || input.id === "new";
  const ref = isNew
    ? getAdminDb().collection(OFFICES).doc()
    : getAdminDb().collection(OFFICES).doc(input.id);

  const capPayload =
    input.dailyBookingCap != null &&
    typeof input.dailyBookingCap === "number" &&
    input.dailyBookingCap > 0
      ? { dailyBookingCap: input.dailyBookingCap }
      : { dailyBookingCap: FieldValue.delete() };

  const stateIds =
    Array.isArray(input.travelerStateIds) && input.travelerStateIds.length > 0
      ? [...new Set(input.travelerStateIds.map(String).filter(Boolean))]
      : null;
  const statePayload = stateIds
    ? { travelerStateIds: stateIds }
    : { travelerStateIds: FieldValue.delete() };

  await ref.set(
    {
      administrationAr: input.administrationAr.trim(),
      nameAr: input.nameAr.trim(),
      addressAr: input.addressAr.trim(),
      phone: input.phone?.trim() || null,
      mapsUrl: input.mapsUrl.trim(),
      service: input.service,
      active: input.active,
      ...statePayload,
      ...capPayload,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await appendActivityLog({
    actor,
    action: isNew ? "office.created" : "office.updated",
    summaryAr: isNew
      ? `إضافة مكتب: ${input.nameAr.trim()}`
      : `تحديث بيانات المكتب: ${input.nameAr.trim()}`,
    officeId: ref.id,
    meta: { officeId: ref.id },
  });

  return ref.id;
}

export async function setOfficeActive(
  officeId: string,
  active: boolean,
  actor: AdminActivityActor,
) {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن تحديث المكتب.");
  }

  const office = await getOffice(officeId);
  const nameAr = office?.nameAr ?? officeId;

  await getAdminDb().collection(OFFICES).doc(officeId).update({
    active,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await appendActivityLog({
    actor,
    action: "office.active_changed",
    summaryAr: active
      ? `تفعيل المكتب: ${nameAr}`
      : `إيقاف المكتب: ${nameAr}`,
    officeId,
    meta: { officeId, active },
  });
}

const ACTIVITY_LOG_DEFAULT_SUPER = 200;
const ACTIVITY_LOG_MAX_SUPER = 500;
const ACTIVITY_LOG_DEFAULT_REQUEST = 100;
const ACTIVITY_LOG_MAX_REQUEST = 200;

export async function listActivityLogsForSuperAdmin(args?: {
  limit?: number;
}): Promise<AdminActivityLogEntry[]> {
  if (!isFirebaseAdminConfigured()) return [];
  const requested = args?.limit ?? ACTIVITY_LOG_DEFAULT_SUPER;
  const limit = Math.min(Math.max(1, requested), ACTIVITY_LOG_MAX_SUPER);
  const snap = await getAdminDb()
    .collection(ACTIVITY_LOGS)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => activityLogFromDoc(d.id, d.data() ?? {}));
}

export async function listActivityLogsForRequest(args: {
  requestId: string;
  role: "super_admin" | "office_user";
  officeId: string | null;
  limit?: number;
}): Promise<AdminActivityLogEntry[]> {
  if (!isFirebaseAdminConfigured()) return [];
  const access = await getRequestForSession({
    id: args.requestId,
    role: args.role,
    officeId: args.officeId,
  });
  if (!access) return [];
  const requested = args.limit ?? ACTIVITY_LOG_DEFAULT_REQUEST;
  const limit = Math.min(Math.max(1, requested), ACTIVITY_LOG_MAX_REQUEST);
  const snap = await getAdminDb()
    .collection(ACTIVITY_LOGS)
    .where("requestId", "==", args.requestId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => activityLogFromDoc(d.id, d.data() ?? {}));
}
