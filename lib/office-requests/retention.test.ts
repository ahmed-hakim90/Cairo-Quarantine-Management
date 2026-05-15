import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import {
  isClosedRequestStatus,
  retentionCutoffs,
  shouldArchiveActivityLogData,
  shouldArchiveRequestData,
} from "@/lib/office-requests/retention";

describe("retention helpers", () => {
  it("uses 90 days for archive cutoff and 6 months for archive deletion", () => {
    const cutoffs = retentionCutoffs(new Date("2026-05-15T12:00:00.000Z"));
    expect(cutoffs.archiveBefore.toISOString()).toBe(
      "2026-02-14T12:00:00.000Z",
    );
    expect(cutoffs.deleteArchivesBefore.toISOString()).toBe(
      "2025-11-15T12:00:00.000Z",
    );
  });

  it("archives only old closed requests", () => {
    const cutoff = new Date("2026-02-14T00:00:00.000Z");
    expect(
      shouldArchiveRequestData(
        {
          status: "completed",
          updatedAt: Timestamp.fromDate(new Date("2026-02-01T00:00:00.000Z")),
        },
        cutoff,
      ),
    ).toBe(true);
    expect(
      shouldArchiveRequestData(
        {
          status: "new",
          updatedAt: Timestamp.fromDate(new Date("2026-01-01T00:00:00.000Z")),
        },
        cutoff,
      ),
    ).toBe(false);
  });

  it("recognizes only completed and cancelled as closed", () => {
    expect(isClosedRequestStatus("completed")).toBe(true);
    expect(isClosedRequestStatus("cancelled")).toBe(true);
    expect(isClosedRequestStatus("contacted")).toBe(false);
  });

  it("archives old activity logs", () => {
    expect(
      shouldArchiveActivityLogData(
        { createdAt: "2026-01-01T00:00:00.000Z" },
        new Date("2026-02-01T00:00:00.000Z"),
      ),
    ).toBe(true);
  });
});
