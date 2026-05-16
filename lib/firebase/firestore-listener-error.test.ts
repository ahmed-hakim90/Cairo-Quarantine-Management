import { describe, expect, it } from "vitest";
import {
  getFirestoreListenerErrorMessage,
  isFirestorePermissionDenied,
} from "@/lib/firebase/firestore-listener-error";

describe("getFirestoreListenerErrorMessage", () => {
  it("maps permission-denied", () => {
    expect(
      getFirestoreListenerErrorMessage({ code: "permission-denied", message: "x" }),
    ).toContain("صلاحية");
  });

  it("maps failed-precondition to index hint", () => {
    expect(
      getFirestoreListenerErrorMessage({
        code: "failed-precondition",
        message: "index",
      }),
    ).toContain("فهرس");
  });

  it("detects permission-denied duck type", () => {
    expect(isFirestorePermissionDenied({ code: "permission-denied" })).toBe(
      true,
    );
  });
});
