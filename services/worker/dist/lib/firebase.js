import { cert, getApp, initializeApp, } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
const ADMIN_APP_NAME = "cqm-worker";
function privateKey() {
    return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}
export function isFirebaseAdminConfigured() {
    return Boolean(process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        privateKey());
}
function getFirebaseAdminApp() {
    try {
        return getApp(ADMIN_APP_NAME);
    }
    catch {
        return initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey(),
            }),
        }, ADMIN_APP_NAME);
    }
}
export function getAdminDb() {
    return getFirestore(getFirebaseAdminApp());
}
export function getAdminMessaging() {
    return getMessaging(getFirebaseAdminApp());
}
