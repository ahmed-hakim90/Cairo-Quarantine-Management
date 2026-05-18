import { NextResponse } from "next/server";

export const ADMIN_REQUEST_HEADER = "x-cqm-admin-request";
export const ADMIN_REQUEST_HEADER_VALUE = "1";

const SAME_ORIGIN_FETCH_SITES = new Set(["none", "same-origin"]);

function originFrom(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function noStoreHeaders(headers = new Headers()): Headers {
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");
  return headers;
}

export function noStoreJson(
  body: unknown,
  init: ResponseInit = {},
): NextResponse {
  const headers = noStoreHeaders(new Headers(init.headers));
  return NextResponse.json(body, { ...init, headers });
}

export function rejectUnsafeAdminRequest(request: Request): NextResponse | null {
  const requestOrigin = new URL(request.url).origin;
  const origin = originFrom(request.headers.get("origin"));
  if (origin && origin !== requestOrigin) {
    return noStoreJson({ error: "forbidden_origin" }, { status: 403 });
  }

  const referer = originFrom(request.headers.get("referer"));
  if (referer && referer !== requestOrigin) {
    return noStoreJson({ error: "forbidden_referer" }, { status: 403 });
  }

  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite && !SAME_ORIGIN_FETCH_SITES.has(fetchSite)) {
    return noStoreJson({ error: "forbidden_fetch_site" }, { status: 403 });
  }

  if (
    request.headers.get(ADMIN_REQUEST_HEADER) !== ADMIN_REQUEST_HEADER_VALUE
  ) {
    return noStoreJson({ error: "missing_admin_request_header" }, { status: 403 });
  }

  return null;
}

export function rejectOversizedRequest(
  request: Request,
  maxBytes: number,
): NextResponse | null {
  const contentLength = Number.parseInt(
    request.headers.get("content-length") ?? "",
    10,
  );
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return noStoreJson({ error: "request_body_too_large" }, { status: 413 });
  }

  return null;
}
