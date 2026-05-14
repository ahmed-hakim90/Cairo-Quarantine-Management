"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteUserProfileAction } from "@/app/[locale]/admin/actions";
import { AdminMessageTemplatesManager } from "@/components/admin/AdminMessageTemplatesManager";
import { SuperAdminAddModal } from "@/components/admin/SuperAdminAddModal";
import type { AdminUserProfile, MessageTemplate, Office } from "@/lib/office-requests/types";

type SuperAdminUsersSectionProps = {
  locale: string;
  offices: Office[];
  users: AdminUserProfile[];
  templates: MessageTemplate[];
  sessionUid: string;
};

export function SuperAdminUsersSection({
  locale,
  offices,
  users,
  templates,
  sessionUid,
}: SuperAdminUsersSectionProps) {
  const router = useRouter();
  const [userToEdit, setUserToEdit] = useState<AdminUserProfile | null>(null);

  async function handleDelete(uid: string) {
    if (
      !window.confirm(
        "حذف المستخدم نهائياً من النظام (حساب تسجيل الدخول وملفه في قاعدة البيانات). هل أنت متأكد؟",
      )
    ) {
      return;
    }
    const fd = new FormData();
    fd.set("uid", uid);
    fd.set("locale", locale);
    try {
      await deleteUserProfileAction(fd);
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "تعذر حذف المستخدم.");
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <AdminMessageTemplatesManager locale={locale} templates={templates} />

      <section className="rounded-lg border border-gov-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-gov-navy">
              مستخدمو لوحة التحكم
            </h2>
            <p className="mt-2 text-sm text-gov-gray-600">
              إضافة سوبر أدمن أو مستخدم مرتبط بمكتب، وتعديل الحسابات.
            </p>
          </div>
          <SuperAdminAddModal
            locale={locale}
            offices={offices}
            userToEdit={userToEdit}
            onClearEdit={() => setUserToEdit(null)}
            onBeforeOpen={() => setUserToEdit(null)}
          />
        </div>

        {users.length > 0 ? (
          <div className="rounded-md bg-gov-gray-50 p-3">
            <p className="text-xs font-bold text-gov-navy">
              المستخدمون المسجلون: {users.length}
            </p>
            <ul className="mt-3 space-y-3 text-xs text-gov-gray-700">
              {users.map((user) => {
                const officeLabel =
                  user.role === "super_admin"
                    ? "سوبر أدمن"
                    : offices.find((o) => o.id === user.officeId)?.nameAr ||
                      "مستخدم مكتب";
                const isSelf = user.uid === sessionUid;
                return (
                  <li
                    key={user.uid}
                    className="border-t border-gov-gray-200 pt-3 first:border-t-0 first:pt-0"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold text-gov-navy">
                          {user.displayName}
                        </span>
                        <span className="mt-0.5 block break-all text-gov-gray-600">
                          {user.email ?? "—"}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-2 text-gov-gray-600">
                          <span>{officeLabel}</span>
                          {!user.active ? (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                              موقوف
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block font-mono text-[10px] text-gov-gray-500">
                          UID: {user.uid}
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-gov-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gov-navy transition hover:bg-gov-gray-100"
                          onClick={() => setUserToEdit(user)}
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          disabled={isSelf}
                          title={
                            isSelf
                              ? "لا يمكن حذف حسابك وأنت مسجّل الدخول"
                              : undefined
                          }
                          className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => {
                            if (!isSelf) void handleDelete(user.uid);
                          }}
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gov-gray-600">لا يوجد مستخدمون مسجلون بعد.</p>
        )}
      </section>
    </div>
  );
}
