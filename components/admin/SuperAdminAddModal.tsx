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
import type { AdminUserProfile, Office } from "@/lib/office-requests/types";

type SuperAdminAddModalProps = {
  locale: string;
  offices: Office[];
  userToEdit?: AdminUserProfile | null;
  onClearEdit?: () => void;
  onBeforeOpen?: () => void;
};

export function SuperAdminAddModal({
  locale,
  offices,
  userToEdit = null,
  onClearEdit,
  onBeforeOpen,
}: SuperAdminAddModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activePanel, setActivePanel] = useState<"office" | "user">("office");

  const panel = userToEdit ? "user" : activePanel;

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
        إضافة مكتب أو مستخدم
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
                : "إضافة مكتب أو مستخدم"}
            </h2>
            <button
              type="button"
              className="rounded-md border border-gov-gray-200 px-2 py-1 text-xs font-bold text-gov-navy hover:bg-gov-gray-50"
              onClick={() => dialogRef.current?.close()}
            >
              إغلاق
            </button>
          </div>
          <div className="mt-3 flex gap-1 rounded-md bg-gov-gray-100 p-1">
            <button
              type="button"
              disabled={!!userToEdit}
              title={
                userToEdit ? "أغلق نافذة التعديل ثم أضف مكتباً جديداً" : undefined
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
        </div>

        <div className="px-4 py-4">
          {panel === "office" ? (
            <form
              action={async (formData) => {
                try {
                  await saveOfficeAction(formData);
                  dialogRef.current?.close();
                  router.refresh();
                } catch (err) {
                  window.alert(
                    err instanceof Error ? err.message : "تعذر حفظ المكتب.",
                  );
                }
              }}
              className="space-y-1"
            >
              <input type="hidden" name="locale" value={locale} />
              <OfficeFormFields office={null} />
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
                try {
                  await saveUserProfileAction(formData);
                  dialogRef.current?.close();
                  router.refresh();
                } catch (err) {
                  window.alert(
                    err instanceof Error ? err.message : "تعذر حفظ المستخدم.",
                  );
                }
              }}
              className="space-y-1"
            >
              <p className="mb-3 text-xs leading-relaxed text-gov-gray-600">
                {userToEdit
                  ? "عدّل الحقول ثم احفظ. اترك كلمة المرور فارغة إن لم ترد تغييرها."
                  : "اترك حقل UID فارغاً لإنشاء مستخدم جديد، أو أدخل UID مستخدم موجود للتعديل اليدوي."}
              </p>
              <input type="hidden" name="locale" value={locale} />
              {userToEdit ? (
                <input type="hidden" name="uid" value={userToEdit.uid} />
              ) : (
                <label className="mt-0 block text-sm font-bold text-gov-navy">
                  Firebase UID للتعديل (اختياري)
                  <input
                    name="uid"
                    className={officeFieldClass}
                    placeholder="فارغ = مستخدم جديد"
                  />
                </label>
              )}
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
              <label className="mt-3 block text-sm font-bold text-gov-navy">
                الصلاحية
                <select
                  name="role"
                  className={officeFieldClass}
                  defaultValue={userToEdit?.role ?? "office_user"}
                >
                  <option value="office_user">مستخدم مكتب</option>
                  <option value="super_admin">سوبر أدمن</option>
                </select>
              </label>
              <label className="mt-3 block text-sm font-bold text-gov-navy">
                المكتب
                <select
                  name="officeId"
                  className={officeFieldClass}
                  defaultValue={userToEdit?.officeId ?? ""}
                >
                  <option value="">بدون</option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.nameAr}
                    </option>
                  ))}
                </select>
              </label>
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
