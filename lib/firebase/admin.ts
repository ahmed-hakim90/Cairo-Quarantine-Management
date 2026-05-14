import {
  cert,
  getApp,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function privateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

const ADMIN_APP_NAME = "cairo-quarantine-admin";

export function isFirebaseAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      privateKey(),
  );
}

export function getFirebaseAdminApp(): App {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase Admin environment variables are not configured.");
  }

  try {
    return getApp(ADMIN_APP_NAME);
  } catch {
    // Initialize below when the named app does not exist in this process.
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey(),
    }),
  }, ADMIN_APP_NAME);
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}
