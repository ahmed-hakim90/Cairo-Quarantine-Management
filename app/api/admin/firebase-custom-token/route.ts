import { getAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAdminSession } from "@/lib/office-requests/session";
import {
  noStoreJson,
  rejectUnsafeAdminRequest,
} from "@/lib/security/admin-request";

export async function GET(request: Request) {
  const unsafe = rejectUnsafeAdminRequest(request);
  if (unsafe) return unsafe;

  const session = await getAdminSession();
  if (!session) {
    return noStoreJson({ error: "unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit({
    key: `admin-firebase-token:${session.uid}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return noStoreJson(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  if (!isFirebaseAdminConfigured()) {
    return noStoreJson(
      { error: "firebase_not_configured" },
      { status: 503 },
    );
  }

  try {
    const customToken = await getAdminAuth().createCustomToken(session.uid);
    return noStoreJson({
      customToken,
      uid: session.uid,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return noStoreJson({ error: message }, { status: 500 });
  }
}
