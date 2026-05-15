import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

const FILE_EXTENSION = /\.[^/]+$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    FILE_EXTENSION.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const segment = segments[0];
  if (segment && isLocale(segment)) {
    if (segment !== defaultLocale && segments[1] === "admin") {
      const url = request.nextUrl.clone();
      url.pathname = `/${defaultLocale}/${segments.slice(1).join("/")}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const target =
    pathname === "/"
      ? `/${defaultLocale}`
      : `/${defaultLocale}${pathname}`;

  return NextResponse.redirect(new URL(target, request.url));
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
