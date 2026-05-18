/**
 * Lists closed requests older than retention window (informational).
 * Extend this script to move docs to an `archived_requests` collection if needed.
 * Usage: node --env-file=.env.local scripts/maintenance/archive-old-requests.mjs
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

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
const archiveBefore = new Date();
archiveBefore.setDate(archiveBefore.getDate() - 90);

const snap = await db
  .collection("requests")
  .where("status", "in", ["completed", "cancelled"])
  .where("updatedAt", "<", Timestamp.fromDate(archiveBefore))
  .limit(200)
  .get();

console.log(
  `Found ${snap.size} closed requests updated before ${archiveBefore.toISOString().slice(0, 10)} (sample cap 200).`,
);
console.log("No automatic deletion — review before archiving.");
