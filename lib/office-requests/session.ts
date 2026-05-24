import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getUserProfile, listOffices } from "@/lib/office-requests/store";
import type { AdminSession } from "@/lib/office-requests/types";

export const ADMIN_SESSION_COOKIE = "cqm_admin_session";

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(token, true);
    const profile = await getUserProfile(decoded.uid);
    if (!profile) return null;
    if (profile.role === "governorate_admin" && profile.governorateId) {
      const offices = await listOffices({ includeInactive: true });
      profile.allowedOfficeIds = offices
        .filter((office) => office.governorateId === profile.governorateId)
        .map((office) => office.id);
    }

    return {
      uid: decoded.uid,
      email: decoded.email ?? profile.email,
      profile,
    };
  } catch {
    return null;
  }
}

/** لوحة التحكم غير متاحة: حساب موقوف أو مستخدم مكتب بلا مكتب معيّن. */
export function shouldShowAdminPendingReview(session: AdminSession): boolean {
  if (!session.profile.active) return true;
  if (session.profile.role === "office_user" || session.profile.role === "office_reception") {
    return !(session.profile.officeId?.trim());
  }
  if (session.profile.role === "office_admin") {
    return (session.profile.allowedOfficeIds ?? []).length === 0;
  }
  if (session.profile.role === "governorate_admin") {
    return !(session.profile.governorateId?.trim());
  }
  return false;
}

export function assertSuperAdmin(session: AdminSession) {
  if (session.profile.role !== "super_admin") {
    throw new Error("غير مصرح بتنفيذ هذا الإجراء.");
  }
}

export function assertCanManageAdminUsers(session: AdminSession) {
  if (
    session.profile.role !== "super_admin" &&
    session.profile.role !== "governorate_admin" &&
    session.profile.role !== "office_admin"
  ) {
    throw new Error("غير مصرح بتنفيذ هذا الإجراء.");
  }
}
