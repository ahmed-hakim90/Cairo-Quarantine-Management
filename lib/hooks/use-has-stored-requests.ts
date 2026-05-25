"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MY_REQUESTS_CHANGED_EVENT,
  MY_REQUESTS_STORAGE_KEY,
  hasStoredRequests,
} from "@/lib/office-requests/my-requests-storage";

export function useHasStoredRequests(): boolean {
  const [hasRequests, setHasRequests] = useState(false);

  const sync = useCallback(() => {
    setHasRequests(hasStoredRequests());
  }, []);

  useEffect(() => {
    sync();

    function onStorage(event: StorageEvent) {
      if (event.key === null || event.key === MY_REQUESTS_STORAGE_KEY) {
        sync();
      }
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(MY_REQUESTS_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(MY_REQUESTS_CHANGED_EVENT, sync);
    };
  }, [sync]);

  return hasRequests;
}
