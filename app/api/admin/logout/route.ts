import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/office-requests/session";
import {
  noStoreJson,
  rejectUnsafeAdminRequest,
} from "@/lib/security/admin-request";

export async function POST(request: Request) {
  const unsafe = rejectUnsafeAdminRequest(request);
  if (unsafe) return unsafe;

  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  return noStoreJson({ ok: true });
}
