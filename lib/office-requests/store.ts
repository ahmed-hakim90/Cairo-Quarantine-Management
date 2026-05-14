import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  getAdminAuth,
  isFirebaseAdminConfigured,
  getAdminDb,
} from "@/lib/firebase/admin";
import { STATIC_OFFICES } from "@/lib/office-requests/static-offices";
import {
  DEFAULT_MESSAGE_TEMPLATE,
  type AdminUserProfile,
  type MessageTemplate,
  type Office,
  type OfficeRequest,
  type OfficeRequestStatus,
  type OfficeRequestType,
  type PublicOfficeRequestStatus,
  type TravelerCategory,
} from "@/lib/office-requests/types";

const OFFICES = "offices";
const REQUESTS = "requests";
const USERS = "users";
const TEMPLATES = "messageTemplates";

function iso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function publicRequestStatus(
  request: OfficeRequest,
): PublicOfficeRequestStatus {
  return {
    id: request.id,
    officeNameAr: request.officeNameAr,
    type: request.type,
    travelerCategory: request.travelerCategory,
    preferredDate: request.preferredDate,
    status: request.status,
    notes: request.notes,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

function officeFromDoc(id: string, data: FirebaseFirestore.DocumentData): Office {
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
    createdAt: data.createdAt ? iso(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? iso(data.updatedAt) : undefined,
  };
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
    travelerCategory: data.travelerCategory
      ? (String(data.travelerCategory) as TravelerCategory)
      : undefined,
    preferredDate: data.preferredDate ? String(data.preferredDate) : undefined,
    status: (data.status ?? "new") as OfficeRequestStatus,
    name: String(data.name ?? ""),
    phone: String(data.phone ?? ""),
    details: String(data.details ?? ""),
    notes: String(data.notes ?? ""),
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

export async function createOfficeRequest(input: {
  officeId: string;
  type: OfficeRequestType;
  travelerCategory?: TravelerCategory;
  preferredDate?: string;
  name: string;
  phone: string;
  details: string;
}): Promise<PublicOfficeRequestStatus> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن حفظ الطلب.");
  }

  const office = await getOffice(input.officeId);
  if (!office?.active) throw new Error("المكتب المختار غير متاح.");

  const now = FieldValue.serverTimestamp();
  const doc = await getAdminDb().collection(REQUESTS).add({
    officeId: office.id,
    officeNameAr: office.nameAr,
    type: input.type,
    ...(input.travelerCategory
      ? { travelerCategory: input.travelerCategory }
      : {}),
    ...(input.preferredDate ? { preferredDate: input.preferredDate } : {}),
    status: "new",
    name: input.name.trim(),
    phone: normalizePhone(input.phone),
    details: input.details.trim(),
    notes: "",
    createdAt: now,
    updatedAt: now,
  });

  const saved = await doc.get();
  return publicRequestStatus(requestFromDoc(doc.id, saved.data() ?? {}));
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

export async function updateRequestForSession(args: {
  id: string;
  role: "super_admin" | "office_user";
  officeId: string | null;
  status: OfficeRequestStatus;
  notes: string;
}) {
  const request = await getRequestForSession(args);
  if (!request) throw new Error("الطلب غير موجود أو غير مصرح.");

  await getAdminDb().collection(REQUESTS).doc(args.id).update({
    status: args.status,
    notes: args.notes.trim(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function markWhatsappSentForSession(args: {
  id: string;
  role: "super_admin" | "office_user";
  officeId: string | null;
}) {
  const request = await getRequestForSession(args);
  if (!request) throw new Error("الطلب غير موجود أو غير مصرح.");

  await getAdminDb().collection(REQUESTS).doc(args.id).update({
    status: "contacted",
    lastWhatsappAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
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

export async function upsertAdminUserAccount(input: {
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
    role: input.role,
    officeId: input.role === "office_user" ? input.officeId : null,
    active: input.active,
  };

  await upsertUserProfile(profile);
  return profile;
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

export async function upsertMessageTemplate(input: MessageTemplate) {
  const id = input.id === "new" ? undefined : input.id;
  const ref = id
    ? getAdminDb().collection(TEMPLATES).doc(id)
    : getAdminDb().collection(TEMPLATES).doc();

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
}

export async function upsertOffice(input: Office): Promise<string> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن حفظ المكتب.");
  }

  const isNew = !input.id || input.id === "new";
  const ref = isNew
    ? getAdminDb().collection(OFFICES).doc()
    : getAdminDb().collection(OFFICES).doc(input.id);

  await ref.set(
    {
      administrationAr: input.administrationAr.trim(),
      nameAr: input.nameAr.trim(),
      addressAr: input.addressAr.trim(),
      phone: input.phone?.trim() || null,
      mapsUrl: input.mapsUrl.trim(),
      service: input.service,
      active: input.active,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return ref.id;
}

export async function setOfficeActive(officeId: string, active: boolean) {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن تحديث المكتب.");
  }

  await getAdminDb().collection(OFFICES).doc(officeId).update({
    active,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export function renderTemplate(args: {
  template: MessageTemplate;
  request: OfficeRequest;
  office: Office;
}) {
  const values: Record<string, string> = {
    name: args.request.name,
    phone: args.request.phone,
    officeName: args.office.nameAr,
    officeAddress: args.office.addressAr,
    officeMapUrl: args.office.mapsUrl,
    requestType: args.request.type,
    requestDetails: args.request.details,
  };

  return args.template.body.replace(/\{([a-zA-Z]+)\}/g, (_match, key) => {
    return values[key] ?? "";
  });
}

export function whatsappUrl(phone: string, message: string) {
  const digits = normalizePhone(phone).replace(/^\+/, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
