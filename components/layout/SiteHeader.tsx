import Link from "next/link";
import { PRIMARY_NAV } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gov-gray-200 bg-gov-navy text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-3">
        <Link
          href="/"
          className="flex flex-col gap-0.5 transition-opacity hover:opacity-95"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-gov-accent-muted opacity-90">
            هيئة صحة عامة — جمهورية مصر العربية
          </span>
          <span className="font-heading text-lg font-bold leading-tight sm:text-xl">
            إدارة الحجر الصحي بالقاهرة
          </span>
        </Link>
        <nav aria-label="التنقل الرئيسي">
          <ul className="flex flex-wrap gap-2 sm:gap-1 md:gap-2">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium text-white/95 transition-colors hover:bg-white/10"
                >
                  {item.labelAr}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
