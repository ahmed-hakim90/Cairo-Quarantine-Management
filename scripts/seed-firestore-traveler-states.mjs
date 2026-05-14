/**
 * يزرع ثلاث حالات مسافرين افتراضية في Firestore (`traveler_states`)
 * بنفس معرّفات النظام القديم: international / hajj_umrah / citizen
 * لتسهيل الربط من لوحة «المكاتب» دون الاعتماد على الاشتقاق من الكود فقط.
 *
 * تشغيل: npm run seed:traveler-states
 * يتطلب نفس متغيرات خدمة Firebase Admin مثل seed:offices.
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const TRAVELER_STATES = [
  { id: "international", labelAr: "مسافر دولي", sortOrder: 0 },
  { id: "hajj_umrah", labelAr: "مسافر حج وعمرة", sortOrder: 1 },
  { id: "citizen", labelAr: "مواطنين", sortOrder: 2 },
];

initializeApp({
  credential: cert({
    projectId: requiredEnv("FIREBASE_PROJECT_ID"),
    clientEmail: requiredEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: requiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();
const batch = db.batch();

for (const row of TRAVELER_STATES) {
  const ref = db.collection("traveler_states").doc(row.id);
  batch.set(
    ref,
    {
      labelAr: row.labelAr,
      sortOrder: row.sortOrder,
      active: true,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

await batch.commit();
console.log(
  `Seeded ${TRAVELER_STATES.length} traveler_states: ${TRAVELER_STATES.map((s) => s.id).join(", ")}`,
);
