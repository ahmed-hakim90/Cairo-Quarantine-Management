import { timingSafeEqual } from "node:crypto";

export function bearerToken(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(/\s+/, 2);
  return scheme?.toLowerCase() === "bearer" ? token ?? "" : "";
}

export function safeTokenEquals(actual: string, expected: string): boolean {
  if (!actual || !expected) return false;

  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length) return false;

  return timingSafeEqual(actualBytes, expectedBytes);
}
