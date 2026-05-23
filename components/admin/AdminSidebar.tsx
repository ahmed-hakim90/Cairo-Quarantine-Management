"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { normalizedNavPath } from "@/components/layout/SiteNavLinks";
import type { AdminRole } from "@/lib/office-requests/types";

type AdminSidebarProps = {
  locale: string;
  role: AdminRole;
  /** First office for queue link (office user / single-office admin). */
  queueOfficeId?: string | null;
  mobileOpen: boolean;
  onClose: () => void;
};

type NavItem = {
  href: string;
  label: string;
  roles?: AdminRole[];
  exact?: boolean;
};

function isActive(normalized: string, item: NavItem): boolean {
  if (item.exact) {
    return normalized === item.href;
  }
  if (normalized === item.href) return true;
  return normalized.startsWith(`${item.href}/`);
}

function NavLinks({
  locale,
  role,
  queueOfficeId,
  onNavigate,
}: {
  locale: string;
  role: AdminRole;
  queueOfficeId?: string | null;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const normalized = normalizedNavPath(pathname);

  const baseItems: NavItem[] = [
    { href: "/admin", label: "الرئيسية", exact: true },
    { href: "/admin/requests", label: "الطلبات" },
    ...(queueOfficeId
      ? [
          {
            href: `/office-dashboard/${queueOfficeId}/queue`,
            label: "طابور اليوم",
          },
        ]
      : []),
  ];

  const superItems: NavItem[] = [
    {
      href: "/admin/reports",
      label: "التقارير",
      roles: ["super_admin", "governorate_admin", "office_admin"],
    },
    {
      href: "/admin/queue",
      label: "طوابير المكاتب",
      roles: ["super_admin", "governorate_admin", "office_admin"],
    },
    { href: "/admin/offices", label: "المكاتب", roles: ["super_admin"] },
    {
      href: "/admin/traveler-states",
      label: "حالات المسافرين",
      roles: ["super_admin"],
    },
    { href: "/admin/vaccines", label: "التطعيمات", roles: ["super_admin"] },
    {
      href: "/admin/destination-countries",
      label: "متطلبات دول المسافر",
      roles: ["super_admin"],
    },
    {
      href: "/admin/users",
      label: "المستخدمون",
      roles: ["super_admin", "governorate_admin", "office_admin"],
    },
    { href: "/admin/settings", label: "الإعدادات", roles: ["super_admin"] },
    { href: "/admin/activity", label: "سجل النشاط", roles: ["super_admin"] },
  ];

  const items = [...baseItems, ...superItems].filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  const linkClass = (active: boolean) =>
    active
      ? "bg-brand-accent/10 font-bold text-brand-primary shadow-sm ring-2 ring-brand-accent/25"
      : "font-medium text-brand-gray-700 hover:bg-brand-gray-50";

  return (
    <nav aria-label="لوحة الإدارة" className="flex flex-col gap-1 p-3">
      <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wide text-gov-gray-500">
        القائمة
      </p>
      {items.map((item) => {
        const active = isActive(normalized, item);
        const fullHref = `/${locale}${item.href}`;
        return (
          <Link
            key={item.href}
            href={fullHref}
            onClick={() => onNavigate()}
            className={`rounded-md px-3 py-2.5 text-sm transition ${linkClass(active)}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar({
  locale,
  role,
  queueOfficeId = null,
  mobileOpen,
  onClose,
}: AdminSidebarProps) {
  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          className="fixed inset-0 z-40 bg-gov-gray-900/10 backdrop-blur-[2px] md:hidden"
          onClick={() => onClose()}
        />
      ) : null}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 z-50 flex w-[min(100%,18rem)] shrink-0 flex-col border-e border-brand-gray-200 bg-white text-brand-primary shadow-xl transition-transform duration-200 start-0 md:static md:z-0 md:w-56 md:max-w-none md:translate-x-0 md:shadow-none ${
          mobileOpen
            ? "translate-x-0"
            : "max-md:ltr:-translate-x-full max-md:rtl:translate-x-full max-md:pointer-events-none md:pointer-events-auto"
        }`}
      >
        <div className="border-b border-brand-gray-200 px-4 py-4">
          <Link
            href={`/${locale}/admin`}
            className="font-heading text-lg font-extrabold text-brand-primary"
            onClick={() => onClose()}
          >
            لوحة الإدارة
          </Link>
          <p className="mt-1 text-xs text-brand-gray-600">متابعة الطلبات والحجوزات</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks
            locale={locale}
            role={role}
            queueOfficeId={queueOfficeId}
            onNavigate={onClose}
          />
        </div>
      </aside>
    </>
  );
}
