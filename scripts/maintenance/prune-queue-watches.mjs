/**
 * Delete queue_watches older than N days (default 7).
 * Usage: node --env-file=.env.local scripts/maintenance/prune-queue-watches.mjs [days]
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const days = Number(process.argv[2] ?? 7);
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - days);
const cutoffYmd = cutoff.toISOString().slice(0, 10);

initializeApp({
  credential: cert({
    projectId: requiredEnv("FIREBASE_PROJECT_ID"),
    clientEmail: requiredEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: requiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();
const snap = await db
  .collection("queue_watches")
  .where("queueDate", "<", cutoffYmd)
  .limit(500)
  .get();

if (snap.empty) {
  console.log("No queue_watches to prune.");
  process.exit(0);
}

const batch = db.batch();
for (const doc of snap.docs) batch.delete(doc.ref);
await batch.commit();
console.log(`Deleted ${snap.size} queue_watches with queueDate < ${cutoffYmd}.`);
