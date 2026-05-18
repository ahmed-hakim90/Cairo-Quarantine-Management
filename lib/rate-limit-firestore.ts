import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

const RATE_LIMITS = "rate_limits";

export type FirestoreRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function docId(scope: string, key: string, windowMs: number): string {
  const windowBucket = Math.floor(Date.now() / windowMs);
  const hash = createHash("sha256").update(key).digest("base64url").slice(0, 16);
  return `${scope}_${hash}_${windowBucket}`;
}

export async function checkFirestoreRateLimit(args: {
  scope: string;
  key: string;
  limit: number;
  windowMs: number;
}): Promise<FirestoreRateLimitResult> {
  if (!isFirebaseAdminConfigured()) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const db = getAdminDb();
  const ref = db.collection(RATE_LIMITS).doc(
    docId(args.scope, args.key, args.windowMs),
  );
  const expiresAt = Timestamp.fromMillis(Date.now() + args.windowMs);

  try {
    const allowed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const count = snap.exists ? Number(snap.data()?.count ?? 0) : 0;
      if (count >= args.limit) return false;
      tx.set(
        ref,
        {
          scope: args.scope,
          count: (count || 0) + 1,
          expiresAt,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return true;
    });
    if (!allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((args.windowMs - (Date.now() % args.windowMs)) / 1000),
      );
      return { allowed: false, retryAfterSeconds };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  } catch {
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
