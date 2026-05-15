"use client";

import {
  onAuthStateChanged,
  signInWithCustomToken,
  type User,
} from "firebase/auth";
import {
  getFirebaseAuth,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";

let authReadyPromise: Promise<User | null> | null = null;

function waitForAuthUser(timeoutMs = 8000): Promise<User | null> {
  const auth = getFirebaseAuth();
  const existing = auth.currentUser;
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      window.clearTimeout(timer);
      unsubscribe();
      resolve(user);
    });
  });
}

export async function ensureAdminFirebaseAuth(): Promise<User | null> {
  if (!isFirebaseClientConfigured()) return null;

  const auth = getFirebaseAuth();
  if (auth.currentUser) return auth.currentUser;

  if (authReadyPromise) return authReadyPromise;

  authReadyPromise = (async () => {
    try {
      const response = await fetch("/api/admin/firebase-custom-token", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) return null;

      const data = (await response.json()) as {
        customToken?: string;
        uid?: string;
      };
      if (!data.customToken || !data.uid) return null;

      if (auth.currentUser?.uid === data.uid) return auth.currentUser;

      await signInWithCustomToken(auth, data.customToken);
      const user = await waitForAuthUser();
      return user?.uid === data.uid ? user : null;
    } catch {
      return null;
    } finally {
      authReadyPromise = null;
    }
  })();

  return authReadyPromise;
}

export function resetAdminFirebaseAuthForTests() {
  authReadyPromise = null;
}
