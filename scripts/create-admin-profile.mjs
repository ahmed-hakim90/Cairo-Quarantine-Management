import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const [uid, email, displayName = "Super Admin"] = process.argv.slice(2);
if (!uid) {
  throw new Error(
    "Usage: npm run admin:create-profile -- <firebase-uid> [email] [displayName]\n" +
      "Example: npm run admin:create-profile -- abc123xyz admin@example.com \"Super Admin\"",
  );
}

initializeApp({
  credential: cert({
    projectId: requiredEnv("FIREBASE_PROJECT_ID"),
    clientEmail: requiredEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: requiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  }),
});

await getFirestore()
  .collection("users")
  .doc(uid)
  .set(
    {
      email: email || null,
      displayName,
      role: "super_admin",
      officeId: null,
      active: true,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

console.log(`Created super_admin profile for ${uid}.`);
