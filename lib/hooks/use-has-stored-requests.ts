"use client";

import { useSyncExternalStore } from "react";
import {
  MY_REQUESTS_CHANGED_EVENT,
  MY_REQUESTS_STORAGE_KEY,
  hasStoredRequests,
} from "@/lib/office-requests/my-requests-storage";

function subscribe(onStoreChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === null || event.key === MY_REQUESTS_STORAGE_KEY) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", onStorage);
  window.addEventListener(MY_REQUESTS_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(MY_REQUESTS_CHANGED_EVENT, onStoreChange);
  };
}

function getSnapshot() {
  return hasStoredRequests();
}

function getServerSnapshot() {
  return false;
}

export function useHasStoredRequests(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
