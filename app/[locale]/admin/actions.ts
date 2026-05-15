"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  getAdminSession,
  assertSuperAdmin,
  assertCanManageAdminUsers,
  ADMIN_SESSION_COOKIE,
  shouldShowAdminPendingReview,
} from "@/lib/office-requests/session";
import {
  deleteAdminUserAccount,
  deleteMessageTemplate,
  deleteOfficeRequestBySuperAdmin,
  getOffice,
  getUserProfile,
  markWhatsappSentForSession,
  OFFICE_REQUESTS_CACHE_TAGS,
  saveBookingSettings,
  setOfficeActive,
  setTravelerStateActive,
  setVaccineActive,
  updateRequestForSession,
  upsertAdminUserAccount,
  upsertMessageTemplate,
  upsertOffice,
  upsertTravelerState,
  upsertVaccine,
} from "@/lib/office-requests/store";
import { inferOfficeServiceFromSelectedTravelerStateIds } from "@/lib/office-requests/office-traveler-state";
import { runRetentionMaintenance } from "@/lib/office-requests/retention";
import {
  adminCanManageUser,
  assertOfficeAdminCanSaveUser,
  normalizeOfficeIds,
} from "@/lib/office-requests/admin-access";
import type {
  AdminActivityActor,
  AdminRole,
  AdminSession,
  Office,
  OfficeRequestStatus,
  TravelerState,
  VaccineCatalogEntry,
  VaccineUserCategory,
} from "@/lib/office-requests/types";
import { DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR } from "@/lib/office-requests/types";
import { locales } from "@/lib/i18n/config";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function formValues(formData: FormData, key: string) {
  return normalizeOfficeIds(formData.getAll(key));
}

function adminActorFromSession(session: AdminSession): AdminActivityActor {
  return {
    uid: session.uid,
    label:
      session.profile.displayName ||
      session.email ||
      session.uid,
  };
}

function revalidatePublicBookingData() {
  revalidateTag(OFFICE_REQUESTS_CACHE_TAGS.publicOffices, "max");
  revalidateTag(OFFICE_REQUESTS_CACHE_TAGS.publicTravelerStates, "max");
  revalidateTag(OFFICE_REQUESTS_CACHE_TAGS.publicBookingSettings, "max");
}

function revalidatePublicVaccineData() {
  revalidateTag(OFFICE_REQUESTS_CACHE_TAGS.publicVaccines, "max");
}

async function requireSession() {
  const session = await getAdminSession();
  if (!session) throw new Error("غير مصرح.");
  if (shouldShowAdminPendingReview(session)) {
    throw new Error("غير مصرح.");
  }
  return session;
}

export async function logoutAdmin(locale: string) {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect(`/${locale}/admin/login`);
}

export async function deleteRequestSuperAdminAction(formData: FormData) {
  const session = await requireSession();
  assertSuperAdmin(session);
  const id = formValue(formData, "id");
  const locale = formValue(formData, "locale") || "ar";
  const confirm = formValue(formData, "confirm");
  if (!id) throw new Error("رمز الطلب مفقود.");
  if (confirm !== id) {
    throw new Error("اكتب رمز الطلب مطابقاً للحقل أعلاه.");
  }

  await deleteOfficeRequestBySuperAdmin(id);

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/requests`);
  revalidatePath(`/${locale}/admin/requests/${id}`);
  redirect(`/${locale}/admin/requests`);
}

export async function updateRequestAction(formData: FormData) {
  const session = await requireSession();
  const id = formValue(formData, "id");
  const locale = formValue(formData, "locale") || "ar";
  const status = formValue(formData, "status") as OfficeRequestStatus;
  const notes = formValue(formData, "notes");

  await updateRequestForSession({
    id,
    status,
    notes,
    role: session.profile.role,
    officeId: session.profile.officeId,
    allowedOfficeIds: session.profile.allowedOfficeIds,
    actor: adminActorFromSession(session),
  });

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/requests`);
  revalidatePath(`/${locale}/admin/requests/${id}`);
}

export async function markWhatsappSentAction(formData: FormData) {
  const session = await requireSession();
  const id = formValue(formData, "id");
  const locale = formValue(formData, "locale") || "ar";

  await markWhatsappSentForSession({
    id,
    role: session.profile.role,
    officeId: session.profile.officeId,
    allowedOfficeIds: session.profile.allowedOfficeIds,
    actor: adminActorFromSession(session),
  });

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/requests`);
  revalidatePath(`/${locale}/admin/requests/${id}`);
}

export async function saveTemplateAction(formData: FormData) {
  const session = await requireSession();
  assertSuperAdmin(session);
  const locale = formValue(formData, "locale") || "ar";

  await upsertMessageTemplate(
    {
      id: formValue(formData, "id") || "new",
      title: formValue(formData, "title"),
      body: formValue(formData, "body"),
      active: formData.get("active") === "on",
    },
    adminActorFromSession(session),
  );

  revalidatePath(`/${locale}/admin`, "layout");
  revalidatePath(`/${locale}/admin/settings`);
}

export async function deleteTemplateAction(formData: FormData) {
  const session = await requireSession();
  assertSuperAdmin(session);
  const locale = formValue(formData, "locale") || "ar";
  const id = formValue(formData, "id");
  if (!id) throw new Error("معرّف القالب مفقود.");

  await deleteMessageTemplate(id, adminActorFromSession(session));

  revalidatePath(`/${locale}/admin`, "layout");
  revalidatePath(`/${locale}/admin/settings`);
}

export async function saveUserProfileAction(formData: FormData) {
  const session = await requireSession();
  assertCanManageAdminUsers(session);
  const locale = formValue(formData, "locale") || "ar";
  const rawRole = formValue(formData, "role") as AdminRole;
  const uid = formValue(formData, "uid");
  const role: AdminRole =
    rawRole === "super_admin" || rawRole === "office_admin"
      ? rawRole
      : "office_user";
  const officeId = formValue(formData, "officeId") || null;
  const allowedOfficeIds = formValues(formData, "allowedOfficeIds");
  const existing = uid ? await getUserProfile(uid) : null;

  assertOfficeAdminCanSaveUser({
    actor: session.profile,
    targetRole: role,
    targetOfficeId: officeId,
    existingTarget: existing,
  });

  await upsertAdminUserAccount({
    actor: adminActorFromSession(session),
    uid: uid || undefined,
    email: formValue(formData, "email"),
    password: formValue(formData, "password") || undefined,
    displayName: formValue(formData, "displayName") || "مستخدم",
    role,
    officeId,
    allowedOfficeIds,
    active: formData.get("active") === "on",
  });

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/users`);
  revalidatePath(`/${locale}/admin/offices`);
}

export async function deleteUserProfileAction(formData: FormData) {
  const session = await requireSession();
  assertCanManageAdminUsers(session);
  const locale = formValue(formData, "locale") || "ar";
  const uid = formValue(formData, "uid");
  if (!uid) throw new Error("معرّف المستخدم مفقود.");
  const target = await getUserProfile(uid);
  if (!target) throw new Error("المستخدم غير موجود.");
  if (!adminCanManageUser(session.profile, target)) {
    throw new Error("لا يمكنك حذف هذا المستخدم.");
  }

  await deleteAdminUserAccount({
    uid,
    actor: adminActorFromSession(session),
  });

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/users`);
  revalidatePath(`/${locale}/admin/offices`);
}

export async function saveBookingSettingsAction(formData: FormData) {
  const session = await requireSession();
  assertSuperAdmin(session);
  const locale = formValue(formData, "locale") || "ar";
  const raw = formValue(formData, "bookingSameDayCutoffHour");
  const n = Number.parseInt(raw, 10);
  await saveBookingSettings(
    {
      bookingSameDayCutoffHour: Number.isFinite(n)
        ? n
        : DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR,
    },
    adminActorFromSession(session),
  );

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/settings`);
  for (const l of locales) {
    revalidatePath(`/${l}/booking`);
  }
  revalidatePublicBookingData();
}

export async function saveOfficeAction(formData: FormData) {
  const session = await requireSession();
  assertSuperAdmin(session);
  const locale = formValue(formData, "locale") || "ar";
  const id = formValue(formData, "id") || "new";
  const capRaw = formValue(formData, "dailyBookingCap");
  let dailyBookingCap: number | null = null;
  if (capRaw !== "") {
    const n = Number.parseInt(capRaw, 10);
    if (Number.isFinite(n) && n > 0) dailyBookingCap = n;
  }

  const travelerStateRaw = formData.getAll("travelerStateIds");
  const travelerStateIds = travelerStateRaw
    .map((v) => String(v).trim())
    .filter(Boolean);

  const isNew = !id || id === "new";
  const existing: Office | null =
    !isNew ? await getOffice(id) : null;

  let service: Office["service"];
  if (travelerStateIds.length > 0) {
    service = inferOfficeServiceFromSelectedTravelerStateIds(travelerStateIds);
  } else if (existing) {
    service = existing.service;
  } else {
    service = "hajj_umrah_travelers";
  }

  await upsertOffice(
    {
      id,
      administrationAr: formValue(formData, "administrationAr"),
      nameAr: formValue(formData, "nameAr"),
      addressAr: formValue(formData, "addressAr"),
      phone: formValue(formData, "phone") || null,
      mapsUrl: formValue(formData, "mapsUrl"),
      service,
      active: formData.get("active") === "on",
      dailyBookingCap,
      travelerStateIds,
    },
    adminActorFromSession(session),
  );

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/offices`);
  for (const l of locales) {
    revalidatePath(`/${l}/booking`);
  }
  revalidateTag(OFFICE_REQUESTS_CACHE_TAGS.publicOffices, "max");
}

export async function setOfficeActiveAction(formData: FormData) {
  const session = await requireSession();
  assertSuperAdmin(session);
  const locale = formValue(formData, "locale") || "ar";
  const officeId = formValue(formData, "officeId");
  const active = formValue(formData, "active") === "true";

  if (!officeId) throw new Error("معرّف المكتب مفقود.");

  await setOfficeActive(officeId, active, adminActorFromSession(session));

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/offices`);
  for (const l of locales) {
    revalidatePath(`/${l}/booking`);
  }
  revalidateTag(OFFICE_REQUESTS_CACHE_TAGS.publicOffices, "max");
}

export async function saveTravelerStateAction(formData: FormData) {
  const session = await requireSession();
  assertSuperAdmin(session);
  const locale = formValue(formData, "locale") || "ar";
  const id = formValue(formData, "id");
  if (!id) throw new Error("معرّف الحالة مطلوب.");

  const labelAr = formValue(formData, "labelAr");
  const sortRaw = formValue(formData, "sortOrder");
  const sortOrder = Number.parseInt(sortRaw, 10);
  const sort = Number.isFinite(sortOrder) ? sortOrder : 0;
  const active = formData.get("active") === "on";

  const entry: TravelerState = {
    id,
    labelAr,
    sortOrder: sort,
    active,
  };

  await upsertTravelerState(entry, adminActorFromSession(session));

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/traveler-states`);
  for (const l of locales) {
    revalidatePath(`/${l}/booking`);
  }
  revalidateTag(OFFICE_REQUESTS_CACHE_TAGS.publicTravelerStates, "max");
}

export async function setTravelerStateActiveAction(formData: FormData) {
  const session = await requireSession();
  assertSuperAdmin(session);
  const locale = formValue(formData, "locale") || "ar";
  const travelerStateId = formValue(formData, "travelerStateId");
  const active = formValue(formData, "active") === "true";

  if (!travelerStateId) throw new Error("معرّف الحالة مفقود.");

  await setTravelerStateActive(
    travelerStateId,
    active,
    adminActorFromSession(session),
  );

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/traveler-states`);
  for (const l of locales) {
    revalidatePath(`/${l}/booking`);
  }
  revalidateTag(OFFICE_REQUESTS_CACHE_TAGS.publicTravelerStates, "max");
}

const VACCINE_CATEGORIES: VaccineUserCategory[] = [
  "international",
  "hajj",
  "umrah",
  "citizen",
];

function parseVaccineCategory(raw: string): VaccineUserCategory {
  return VACCINE_CATEGORIES.includes(raw as VaccineUserCategory)
    ? (raw as VaccineUserCategory)
    : "international";
}

function revalidatePublicVaccinePages() {
  for (const l of locales) {
    revalidatePath(`/${l}`);
    revalidatePath(`/${l}/international-traveler`);
    revalidatePath(`/${l}/citizen-services`);
    revalidatePath(`/${l}/hajj-umrah`);
  }
  revalidatePublicVaccineData();
}

export async function saveVaccineAction(formData: FormData) {
  const session = await requireSession();
  assertSuperAdmin(session);
  const locale = formValue(formData, "locale") || "ar";

  const id = formValue(formData, "id");
  if (!id) throw new Error("معرّف اللقاح مطلوب.");

  const category = parseVaccineCategory(formValue(formData, "category"));
  const nameAr = formValue(formData, "nameAr");
  const nameEn = formValue(formData, "nameEn");
  const free = formData.get("free") === "on";
  const active = formData.get("active") === "on";
  const sortRaw = formValue(formData, "sortOrder");
  const sortOrder = Number.parseInt(sortRaw, 10);
  const sort = Number.isFinite(sortOrder) ? sortOrder : 0;

  const priceRaw = formValue(formData, "priceEgp");
  let priceEgp: number | null = null;
  if (!free && priceRaw !== "") {
    const n = Number.parseFloat(priceRaw);
    priceEgp = Number.isFinite(n) ? n : null;
  }

  const entry: VaccineCatalogEntry = {
    id,
    category,
    nameAr,
    nameEn,
    priceEgp: free ? null : priceEgp,
    free,
    sortOrder: sort,
    active,
  };

  await upsertVaccine(entry, adminActorFromSession(session));

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/vaccines`);
  revalidatePublicVaccinePages();
}

export async function setVaccineActiveAction(formData: FormData) {
  const session = await requireSession();
  assertSuperAdmin(session);
  const locale = formValue(formData, "locale") || "ar";
  const vaccineId = formValue(formData, "vaccineId");
  const active = formValue(formData, "active") === "true";

  if (!vaccineId) throw new Error("معرّف اللقاح مفقود.");

  await setVaccineActive(vaccineId, active, adminActorFromSession(session));

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/vaccines`);
  revalidatePublicVaccinePages();
}

export async function runRetentionMaintenanceAction() {
  const session = await requireSession();
  assertSuperAdmin(session);
  return runRetentionMaintenance();
}
