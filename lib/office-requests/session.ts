import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getUserProfile } from "@/lib/office-requests/store";
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
  if (session.profile.role === "office_user") {
    return !(session.profile.officeId?.trim());
  }
  return false;
}

export function assertSuperAdmin(session: AdminSession) {
  if (session.profile.role !== "super_admin") {
    throw new Error("غير مصرح بتنفيذ هذا الإجراء.");
  }
}
