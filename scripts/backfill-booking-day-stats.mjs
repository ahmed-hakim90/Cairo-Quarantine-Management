/**
 * One-time backfill: booking_day_stats from active (non-cancelled) bookings.
 * Usage: node --env-file=.env.local scripts/backfill-booking-day-stats.mjs
 */
import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

initializeApp({
  credential: cert({
    projectId: requiredEnv("FIREBASE_PROJECT_ID"),
    clientEmail: requiredEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: requiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();

const officeCaps = new Map();
const usedByKey = new Map();

const officesSnap = await db.collection("offices").get();
for (const doc of officesSnap.docs) {
  const cap = doc.data().dailyBookingCap;
  if (typeof cap === "number" && cap > 0) {
    officeCaps.set(doc.id, cap);
  }
}

const requestsSnap = await db
  .collection("requests")
  .where("type", "==", "booking")
  .get();

for (const doc of requestsSnap.docs) {
  const data = doc.data();
  if (data.status === "cancelled") continue;
  const officeId = data.officeId;
  const date = data.preferredDate;
  if (!officeId || !date || !officeCaps.has(officeId)) continue;
  const key = `${officeId}_${date}`;
  usedByKey.set(key, (usedByKey.get(key) ?? 0) + 1);
}

let written = 0;
const batchSize = 400;
let batch = db.batch();
let ops = 0;

const keyRe = /^(.+)_(\d{4}-\d{2}-\d{2})$/;

for (const [key, used] of usedByKey) {
  const parsed = keyRe.exec(key);
  if (!parsed) {
    console.warn(`Skipping invalid stats key: ${key}`);
    continue;
  }
  const officeId = parsed[1];
  const date = parsed[2];
  const cap = officeCaps.get(officeId);
  const ref = db.collection("booking_day_stats").doc(key);
  batch.set(
    ref,
    {
      officeId,
      date,
      cap,
      used,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  ops += 1;
  written += 1;
  if (ops >= batchSize) {
    await batch.commit();
    batch = db.batch();
    ops = 0;
  }
}

if (ops > 0) await batch.commit();

console.log(
  `Backfill complete: ${written} booking_day_stats documents (${requestsSnap.size} booking requests scanned).`,
);
