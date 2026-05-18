import type { AdminRole, AdminUserProfile } from "@/lib/office-requests/types";

export type AdminRequestScope = {
  role: AdminRole;
  governorateId?: string | null;
  officeId: string | null;
  allowedOfficeIds?: string[];
};

export function normalizeOfficeIds(ids: readonly unknown[]): string[] {
  return [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
}

export function roleLabelAr(role: AdminRole): string {
  if (role === "super_admin") return "سوبر أدمن";
  if (role === "governorate_admin") return "أدمن محافظة";
  if (role === "office_admin") return "أدمن مكاتب";
  return "مستخدم مكتب";
}

export function adminAllowedOfficeIds(
  profile: Pick<AdminUserProfile, "role" | "officeId" | "allowedOfficeIds">,
): string[] {
  if (profile.role === "super_admin") return [];
  if (profile.role === "office_admin" || profile.role === "governorate_admin") {
    return normalizeOfficeIds(profile.allowedOfficeIds ?? []);
  }
  return profile.officeId?.trim() ? [profile.officeId.trim()] : [];
}

export function adminCanAccessOffice(
  profile: Pick<AdminUserProfile, "role" | "officeId" | "allowedOfficeIds">,
  officeId: string | null | undefined,
): boolean {
  const id = officeId?.trim();
  if (!id) return false;
  if (profile.role === "super_admin") return true;
  return adminAllowedOfficeIds(profile).includes(id);
}

export function scopedOfficeIdForProfile(
  profile: Pick<AdminUserProfile, "role" | "officeId" | "allowedOfficeIds">,
): string | null {
  if (profile.role !== "office_user") return null;
  return profile.officeId?.trim() || null;
}

export function adminCanManageUser(
  actor: Pick<AdminUserProfile, "uid" | "role" | "officeId" | "allowedOfficeIds">,
  target: Pick<AdminUserProfile, "uid" | "role" | "officeId" | "allowedOfficeIds">,
): boolean {
  if (actor.role === "super_admin") return true;
  if (actor.role !== "office_admin" && actor.role !== "governorate_admin") {
    return false;
  }
  if (target.uid === actor.uid) return false;
  if (target.role !== "office_user") return false;
  return adminCanAccessOffice(actor, target.officeId);
}

export function assertOfficeAdminCanSaveUser(input: {
  actor: Pick<AdminUserProfile, "role" | "officeId" | "allowedOfficeIds">;
  targetRole: AdminRole;
  targetOfficeId: string | null;
  existingTarget?: Pick<
    AdminUserProfile,
    "role" | "officeId" | "allowedOfficeIds"
  > | null;
}): void {
  if (input.actor.role === "super_admin") return;
  if (
    input.actor.role !== "office_admin" &&
    input.actor.role !== "governorate_admin"
  ) {
    throw new Error("غير مصرح بتنفيذ هذا الإجراء.");
  }
  if (input.targetRole !== "office_user") {
    throw new Error("الأدمن المحلي يمكنه إنشاء مستخدمي مكاتب فقط.");
  }
  if (!adminCanAccessOffice(input.actor, input.targetOfficeId)) {
    throw new Error("المكتب المختار غير متاح ضمن صلاحياتك.");
  }
  if (
    input.existingTarget &&
    (input.existingTarget.role !== "office_user" ||
      !adminCanAccessOffice(input.actor, input.existingTarget.officeId))
  ) {
    throw new Error("لا يمكنك تعديل هذا المستخدم.");
  }
}
