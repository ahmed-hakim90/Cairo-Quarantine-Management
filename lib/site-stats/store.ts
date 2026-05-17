import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export { SITE_VISITOR_MIN_DISPLAY, formatSiteVisitorDisplay } from "@/lib/site-stats/display";

const STATS = "stats";
const SITE_VISITORS_DOC = "siteVisitors";

function parseTotal(data: DocumentData | undefined): number {
  const raw = data?.total;
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function getSiteVisitorCount(): Promise<number> {
  if (!isFirebaseAdminConfigured()) return 0;
  try {
    const doc = await getAdminDb().collection(STATS).doc(SITE_VISITORS_DOC).get();
    if (!doc.exists) return 0;
    return parseTotal(doc.data());
  } catch {
    return 0;
  }
}

export async function incrementSiteVisitorCount(): Promise<number> {
  if (!isFirebaseAdminConfigured()) return 0;
  const ref = getAdminDb().collection(STATS).doc(SITE_VISITORS_DOC);
  await ref.set(
    {
      total: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  const doc = await ref.get();
  return parseTotal(doc.data());
}
