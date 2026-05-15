import { NextResponse } from "next/server";
import { getAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAdminSession } from "@/lib/office-requests/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit({
    key: `admin-firebase-token:${session.uid}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: "firebase_not_configured" },
      { status: 503 },
    );
  }

  try {
    const customToken = await getAdminAuth().createCustomToken(session.uid);
    return NextResponse.json({
      customToken,
      uid: session.uid,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
