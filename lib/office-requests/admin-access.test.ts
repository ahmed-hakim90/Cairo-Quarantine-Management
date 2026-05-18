import { describe, expect, it } from "vitest";
import {
  adminCanAccessOffice,
  adminCanManageUser,
  assertOfficeAdminCanSaveUser,
} from "@/lib/office-requests/admin-access";
import type { AdminUserProfile } from "@/lib/office-requests/types";

function profile(
  partial: Partial<AdminUserProfile> & Pick<AdminUserProfile, "role">,
): AdminUserProfile {
  return {
    uid: partial.uid ?? "uid",
    email: partial.email ?? null,
    displayName: partial.displayName ?? "User",
    governorateId: partial.governorateId ?? null,
    officeId: partial.officeId ?? null,
    allowedOfficeIds: partial.allowedOfficeIds,
    active: partial.active ?? true,
    role: partial.role,
  };
}

describe("office admin access", () => {
  it("allows office_admin to access only assigned offices", () => {
    const actor = profile({
      role: "office_admin",
      allowedOfficeIds: ["airport", "maadi"],
    });

    expect(adminCanAccessOffice(actor, "airport")).toBe(true);
    expect(adminCanAccessOffice(actor, "maadi")).toBe(true);
    expect(adminCanAccessOffice(actor, "nozha")).toBe(false);
  });

  it("prevents office_admin from managing admins", () => {
    const actor = profile({
      uid: "actor",
      role: "office_admin",
      allowedOfficeIds: ["airport"],
    });
    const target = profile({
      uid: "target",
      role: "office_admin",
      allowedOfficeIds: ["airport"],
    });

    expect(adminCanManageUser(actor, target)).toBe(false);
    expect(() =>
      assertOfficeAdminCanSaveUser({
        actor,
        targetRole: "office_admin",
        targetOfficeId: null,
      }),
    ).toThrow("مستخدمي مكاتب فقط");
  });

  it("prevents office_admin from creating office users outside assigned offices", () => {
    const actor = profile({
      role: "office_admin",
      allowedOfficeIds: ["airport"],
    });

    expect(() =>
      assertOfficeAdminCanSaveUser({
        actor,
        targetRole: "office_user",
        targetOfficeId: "maadi",
      }),
    ).toThrow("المكتب المختار غير متاح");
  });

  it("allows office_admin to create office users inside assigned offices", () => {
    const actor = profile({
      role: "office_admin",
      allowedOfficeIds: ["airport"],
    });

    expect(() =>
      assertOfficeAdminCanSaveUser({
        actor,
        targetRole: "office_user",
        targetOfficeId: "airport",
      }),
    ).not.toThrow();
  });

  it("allows governorate_admin to access offices resolved for their governorate", () => {
    const actor = profile({
      role: "governorate_admin",
      governorateId: "cairo",
      allowedOfficeIds: ["airport", "maadi"],
    });

    expect(adminCanAccessOffice(actor, "airport")).toBe(true);
    expect(adminCanAccessOffice(actor, "giza-office")).toBe(false);
  });

  it("allows governorate_admin to create office users only in resolved offices", () => {
    const actor = profile({
      role: "governorate_admin",
      governorateId: "cairo",
      allowedOfficeIds: ["airport"],
    });

    expect(() =>
      assertOfficeAdminCanSaveUser({
        actor,
        targetRole: "office_user",
        targetOfficeId: "airport",
      }),
    ).not.toThrow();
    expect(() =>
      assertOfficeAdminCanSaveUser({
        actor,
        targetRole: "office_user",
        targetOfficeId: "maadi",
      }),
    ).toThrow("المكتب المختار غير متاح");
  });
});
