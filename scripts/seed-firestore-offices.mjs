import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const source = readFileSync("data/hajj-traveler-offices-cairo.ts", "utf8");
const match = source.match(
  /export const CAIRO_TRAVELER_VACCINATION_OFFICES:[\s\S]*?=\s*(\[[\s\S]*?\]);/,
);

if (!match) {
  throw new Error("Could not find CAIRO_TRAVELER_VACCINATION_OFFICES.");
}

const offices = Function(`return (${match[1]});`)();

initializeApp({
  credential: cert({
    projectId: requiredEnv("FIREBASE_PROJECT_ID"),
    clientEmail: requiredEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: requiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();
const batch = db.batch();

for (const office of offices) {
  const ref = db.collection("offices").doc(office.id);
  batch.set(
    ref,
    {
      administrationAr: office.administrationAr,
      governorateId: "cairo",
      serialInGovernorate: office.serialInGovernorate,
      nameAr: office.officeNameAr,
      addressAr: office.addressAr,
      phone: office.phone,
      mapsUrl: office.mapsUrl,
      service: office.service,
      active: true,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

await batch.commit();
console.log(`Seeded ${offices.length} offices.`);
