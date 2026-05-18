"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveOfficeAction,
  saveUserProfileAction,
} from "@/app/[locale]/admin/actions";
import {
  OfficeFormFields,
  officeFieldClass,
} from "@/components/admin/OfficeFormFields";
import { EGYPT_GOVERNORATES } from "@/data/governorates";
import { defaultTravelerStatesFromLegacyLabels } from "@/lib/office-requests/office-traveler-state";
import { runWithFeedback } from "@/lib/ui/run-with-feedback";
import type { AdminRole, AdminUserProfile, Office } from "@/lib/office-requests/types";

type SuperAdminAddModalProps = {
  locale: string;
  offices: Office[];
  userToEdit?: AdminUserProfile | null;
  actorRole?: AdminRole;
  allowOfficeCreation?: boolean;
  onClearEdit?: () => void;
  onBeforeOpen?: () => void;
};

function UserRoleOfficeFields({
  actorRole,
  offices,
  userToEdit,
}: {
  actorRole: AdminRole;
  offices: Office[];
  userToEdit: AdminUserProfile | null;
}) {
  const [selectedRole, setSelectedRole] = useState<AdminRole>(
    userToEdit?.role ?? "office_user",
  );

  return (
    <>
      {actorRole === "super_admin" ? (
        <label className="mt-3 block text-sm font-bold text-gov-navy">
          الصلاحية
          <select
            name="role"
            className={officeFieldClass}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as AdminRole)}
          >
            <option value="office_user">مستخدم مكتب</option>
            <option value="governorate_admin">أدمن محافظة</option>
            <option value="office_admin">أدمن مكاتب</option>
            <option value="super_admin">سوبر أدمن</option>
          </select>
        </label>
      ) : (
        <input type="hidden" name="role" value="office_user" />
      )}

      {selectedRole === "governorate_admin" ? (
        <label className="mt-3 block text-sm font-bold text-gov-navy">
          المحافظة
          <select
            name="governorateId"
            className={officeFieldClass}
            defaultValue={userToEdit?.governorateId ?? ""}
            required
          >
            <option value="">اختر محافظة</option>
            {EGYPT_GOVERNORATES.filter((g) => g.active).map((governorate) => (
              <option key={governorate.id} value={governorate.id}>
                {governorate.labelAr}
              </option>
            ))}
          </select>
        </label>
      ) : selectedRole === "office_admin" ? (
        <fieldset className="mt-3 rounded-md border border-gov-gray-200 p-3">
          <legend className="px-1 text-sm font-bold text-gov-navy">
            المكاتب المفتوحة
          </legend>
          <div className="mt-2 max-h-52 space-y-2 overflow-y-auto pe-1">
            {offices.map((office) => (
              <label
                key={office.id}
                className="flex items-start gap-2 text-sm font-semibold text-gov-navy"
              >
                <input
                  name="allowedOfficeIds"
                  type="checkbox"
                  value={office.id}
                  defaultChecked={(userToEdit?.allowedOfficeIds ?? []).includes(
                    office.id,
                  )}
                  className="mt-1"
                />
                <span>{office.nameAr}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : selectedRole === "office_user" ? (
        <label className="mt-3 block text-sm font-bold text-gov-navy">
          المكتب
          <select
            name="officeId"
            className={officeFieldClass}
            defaultValue={userToEdit?.officeId ?? ""}
            required
          >
            <option value="">اختر مكتباً</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.nameAr}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </>
  );
}

export function SuperAdminAddModal({
  locale,
  offices,
  userToEdit = null,
  actorRole = "super_admin",
  allowOfficeCreation = true,
  onClearEdit,
  onBeforeOpen,
}: SuperAdminAddModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activePanel, setActivePanel] = useState<"office" | "user">("office");
  const canManageOffices = actorRole === "super_admin" && allowOfficeCreation;

  const panel = userToEdit ? "user" : canManageOffices ? activePanel : "user";
  const showPanelSwitcher = canManageOffices;

  useEffect(() => {
    if (userToEdit) {
      dialogRef.current?.showModal();
    }
  }, [userToEdit]);

  function handleDialogClose() {
    onClearEdit?.();
  }

  const userFormKey = userToEdit ? `edit-${userToEdit.uid}` : "create-user";

  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-10 items-center justify-center rounded-md bg-gov-accent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gov-navy"
        onClick={() => {
          onBeforeOpen?.();
          dialogRef.current?.showModal();
        }}
      >
        {canManageOffices ? "إضافة مكتب أو مستخدم" : "إضافة مستخدم"}
      </button>
      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        className="m-auto max-h-[90vh] w-[min(100%,32rem)] max-w-[calc(100%-2rem)] overflow-y-auto rounded-lg border border-gov-gray-200 bg-white p-0 shadow-xl backdrop:bg-black/40"
        dir="rtl"
        aria-labelledby="super-admin-add-title"
      >
        <div className="border-b border-gov-gray-200 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <h2
              id="super-admin-add-title"
              className="font-heading text-lg font-extrabold text-gov-navy"
            >
              {panel === "user" && userToEdit
                ? "تعديل مستخدم"
                : canManageOffices
                  ? "إضافة مكتب أو مستخدم"
                  : "إضافة مستخدم"}
            </h2>
            <button
              type="button"
              className="rounded-md border border-gov-gray-200 px-2 py-1 text-xs font-bold text-gov-navy hover:bg-gov-gray-50"
              onClick={() => dialogRef.current?.close()}
            >
              إغلاق
            </button>
          </div>
          {showPanelSwitcher ? (
            <div className="mt-3 flex gap-1 rounded-md bg-gov-gray-100 p-1">
              {canManageOffices ? (
                <button
                  type="button"
                  disabled={!!userToEdit}
                  title={
                    userToEdit
                      ? "أغلق نافذة التعديل ثم أضف مكتباً جديداً"
                      : undefined
                  }
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    panel === "office"
                      ? "bg-white text-gov-navy shadow-sm"
                      : "text-gov-gray-600"
                  }`}
                  onClick={() => {
                    if (!userToEdit) setActivePanel("office");
                  }}
                >
                  مكتب جديد
                </button>
              ) : null}
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-2 text-xs font-extrabold transition ${
                  panel === "user"
                    ? "bg-white text-gov-navy shadow-sm"
                    : "text-gov-gray-600"
                }`}
                onClick={() => setActivePanel("user")}
              >
                مستخدم جديد
              </button>
            </div>
          ) : null}
        </div>

        <div className="px-4 py-4">
          {panel === "office" ? (
            <form
              action={async (formData) => {
                await runWithFeedback(() => saveOfficeAction(formData), {
                  successMessage: "تم حفظ المكتب.",
                  errorMessage: "تعذر حفظ المكتب.",
                  onSuccess: () => {
                    dialogRef.current?.close();
                    router.refresh();
                  },
                });
              }}
              className="space-y-1"
            >
              <input type="hidden" name="locale" value={locale} />
              <OfficeFormFields
                office={null}
                travelerStates={defaultTravelerStatesFromLegacyLabels()}
              />
              <button
                type="submit"
                className="mt-4 w-full rounded-md bg-gov-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-gov-navy"
              >
                حفظ المكتب
              </button>
            </form>
          ) : (
            <form
              key={userFormKey}
              action={async (formData) => {
                await runWithFeedback(() => saveUserProfileAction(formData), {
                  successMessage: "تم حفظ المستخدم.",
                  errorMessage: "تعذر حفظ المستخدم.",
                  onSuccess: () => {
                    dialogRef.current?.close();
                    router.refresh();
                  },
                });
              }}
              className="space-y-1"
            >
              {userToEdit ? (
                <p className="mb-3 text-xs leading-relaxed text-gov-gray-600">
                  عدّل الحقول ثم احفظ. اترك كلمة المرور فارغة إن لم ترد تغييرها.
                </p>
              ) : null}
              <input type="hidden" name="locale" value={locale} />
              {userToEdit ? (
                <input type="hidden" name="uid" value={userToEdit.uid} />
              ) : null}
              <label className="mt-3 block text-sm font-bold text-gov-navy">
                الاسم المعروض
                <input
                  name="displayName"
                  required
                  className={officeFieldClass}
                  defaultValue={userToEdit?.displayName ?? ""}
                />
              </label>
              <label className="mt-3 block text-sm font-bold text-gov-navy">
                البريد (تسجيل الدخول)
                <input
                  name="email"
                  type="email"
                  required
                  className={officeFieldClass}
                  defaultValue={userToEdit?.email ?? ""}
                />
              </label>
              <label className="mt-3 block text-sm font-bold text-gov-navy">
                كلمة المرور
                <input
                  name="password"
                  type="password"
                  className={officeFieldClass}
                  placeholder={
                    userToEdit
                      ? "اتركه فارغاً للإبقاء على كلمة المرور الحالية"
                      : "مطلوبة عند الإنشاء (6 أحرف على الأقل)"
                  }
                  {...(!userToEdit ? { minLength: 6 } : {})}
                />
              </label>
              <UserRoleOfficeFields
                key={`role-fields-${userFormKey}`}
                actorRole={actorRole}
                offices={offices}
                userToEdit={userToEdit}
              />
              <label className="mt-3 flex items-center gap-2 text-sm font-bold text-gov-navy">
                <input
                  name="active"
                  type="checkbox"
                  defaultChecked={userToEdit?.active ?? true}
                />
                مفعل
              </label>
              <button
                type="submit"
                className="mt-4 w-full rounded-md bg-gov-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-gov-navy"
              >
                {userToEdit ? "حفظ التعديلات" : "حفظ المستخدم"}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
