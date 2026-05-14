import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const source = readFileSync("data/vaccines.ts", "utf8");
const assignIdx = source.indexOf("export const VACCINES_BY_CATEGORY");
if (assignIdx === -1) {
  throw new Error("Could not find VACCINES_BY_CATEGORY.");
}
const braceStart = source.indexOf("{", source.indexOf("=", assignIdx));
if (braceStart === -1) throw new Error("Could not find object start.");

let depth = 0;
let end = -1;
for (let i = braceStart; i < source.length; i++) {
  const c = source[i];
  if (c === "{") depth++;
  else if (c === "}") {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}
if (end === -1) throw new Error("Could not find object end.");

const vaccinesByCategory = Function(
  `"use strict"; return (${source.slice(braceStart, end)});`,
)();

const categories = ["international", "hajj", "umrah", "citizen"];

initializeApp({
  credential: cert({
    projectId: requiredEnv("FIREBASE_PROJECT_ID"),
    clientEmail: requiredEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: requiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();
const batch = db.batch();

let count = 0;
for (const category of categories) {
  const rows = vaccinesByCategory[category] ?? [];
  rows.forEach((row, index) => {
    const ref = db.collection("vaccines").doc(row.id);
    batch.set(
      ref,
      {
        category,
        nameAr: row.nameAr,
        nameEn: row.nameEn,
        priceEgp: row.free ? null : row.priceEgp,
        free: row.free === true,
        sortOrder: index,
        active: true,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    count++;
  });
}

await batch.commit();
console.log(`Seeded ${count} vaccine documents.`);
