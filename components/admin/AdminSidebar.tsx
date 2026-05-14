"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { normalizedNavPath } from "@/components/layout/SiteNavLinks";
import type { AdminRole } from "@/lib/office-requests/types";

type AdminSidebarProps = {
  locale: string;
  role: AdminRole;
  mobileOpen: boolean;
  onClose: () => void;
};

type NavItem = { href: string; label: string; superOnly?: boolean; exact?: boolean };

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
  onNavigate,
}: {
  locale: string;
  role: AdminRole;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const normalized = normalizedNavPath(pathname);

  const baseItems: NavItem[] = [
    { href: "/admin", label: "الرئيسية", exact: true },
    { href: "/admin/requests", label: "الطلبات" },
  ];

  const superItems: NavItem[] = [
    { href: "/admin/offices", label: "المكاتب", superOnly: true },
    { href: "/admin/vaccines", label: "التطعيمات", superOnly: true },
    { href: "/admin/users", label: "المستخدمون", superOnly: true },
    { href: "/admin/settings", label: "الإعدادات", superOnly: true },
    { href: "/admin/activity", label: "سجل النشاط", superOnly: true },
  ];

  const items =
    role === "super_admin" ? [...baseItems, ...superItems] : baseItems;

  const linkClass = (active: boolean) =>
    active
      ? "bg-gov-gray-100 font-bold text-gov-navy shadow-sm ring-2 ring-gov-accent/25"
      : "font-medium text-gov-gray-700 hover:bg-gov-gray-50";

  return (
    <nav aria-label="لوحة الإدارة" className="flex flex-col gap-1 p-3">
      <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wide text-gov-gray-500">
        القائمة
      </p>
      {items.map((item) => {
        if (item.superOnly && role !== "super_admin") return null;
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

export function AdminSidebar({ locale, role, mobileOpen, onClose }: AdminSidebarProps) {
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
        className={`fixed inset-y-0 z-50 flex w-[min(100%,18rem)] shrink-0 flex-col border-e border-gov-gray-200 bg-white text-gov-navy shadow-xl transition-transform duration-200 start-0 md:static md:z-0 md:w-56 md:max-w-none md:translate-x-0 md:shadow-none ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full pointer-events-none md:pointer-events-auto md:translate-x-0"
        }`}
      >
        <div className="border-b border-gov-gray-200 px-4 py-4">
          <Link
            href={`/${locale}/admin`}
            className="font-heading text-lg font-extrabold text-gov-navy"
            onClick={() => onClose()}
          >
            لوحة الإدارة
          </Link>
          <p className="mt-1 text-xs text-gov-gray-600">متابعة الطلبات والحجوزات</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks locale={locale} role={role} onNavigate={onClose} />
        </div>
      </aside>
    </>
  );
}
