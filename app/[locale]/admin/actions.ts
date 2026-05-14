"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAdminSession, assertSuperAdmin, ADMIN_SESSION_COOKIE } from "@/lib/office-requests/session";
import {
  markWhatsappSentForSession,
  setOfficeActive,
  updateRequestForSession,
  upsertAdminUserAccount,
  upsertMessageTemplate,
  upsertOffice,
} from "@/lib/office-requests/store";
import type {
  AdminRole,
  OfficeRequestStatus,
} from "@/lib/office-requests/types";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireSession() {
  const session = await getAdminSession();
  if (!session) throw new Error("غير مصرح.");
  return session;
}

export async function logoutAdmin(locale: string) {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect(`/${locale}/admin/login`);
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
  });

  revalidatePath(`/${locale}/admin`);
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
  });

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/requests/${id}`);
}

export async function saveTemplateAction(formData: FormData) {
  const session = await requireSession();
  assertSuperAdmin(session);
  const locale = formValue(formData, "locale") || "ar";

  await upsertMessageTemplate({
    id: formValue(formData, "id") || "new",
    title: formValue(formData, "title"),
    body: formValue(formData, "body"),
    active: formData.get("active") === "on",
  });

  revalidatePath(`/${locale}/admin`);
}

export async function saveUserProfileAction(formData: FormData) {
  const session = await requireSession();
  assertSuperAdmin(session);
  const locale = formValue(formData, "locale") || "ar";
  const role = formValue(formData, "role") as AdminRole;
  const uid = formValue(formData, "uid");

  await upsertAdminUserAccount({
    uid: uid || undefined,
    email: formValue(formData, "email"),
    password: formValue(formData, "password") || undefined,
    displayName: formValue(formData, "displayName") || "مستخدم",
    role: role === "super_admin" ? "super_admin" : "office_user",
    officeId: formValue(formData, "officeId") || null,
    active: formData.get("active") === "on",
  });

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/offices`);
}

export async function saveOfficeAction(formData: FormData) {
  const session = await requireSession();
  assertSuperAdmin(session);
  const locale = formValue(formData, "locale") || "ar";
  const id = formValue(formData, "id") || "new";
  const serviceRaw = formValue(formData, "service");

  await upsertOffice({
    id,
    administrationAr: formValue(formData, "administrationAr"),
    nameAr: formValue(formData, "nameAr"),
    addressAr: formValue(formData, "addressAr"),
    phone: formValue(formData, "phone") || null,
    mapsUrl: formValue(formData, "mapsUrl"),
    service:
      serviceRaw === "hajj_umrah_only"
        ? "hajj_umrah_only"
        : "hajj_umrah_travelers",
    active: formData.get("active") === "on",
  });

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/offices`);
}

export async function setOfficeActiveAction(formData: FormData) {
  const session = await requireSession();
  assertSuperAdmin(session);
  const locale = formValue(formData, "locale") || "ar";
  const officeId = formValue(formData, "officeId");
  const active = formValue(formData, "active") === "true";

  if (!officeId) throw new Error("معرّف المكتب مفقود.");

  await setOfficeActive(officeId, active);

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/offices`);
}
