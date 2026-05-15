import { describe, expect, it, vi } from "vitest";
import { resolveActivityLogFirestoreBounds } from "@/lib/office-requests/activity-log-filters";

describe("resolveActivityLogFirestoreBounds", () => {
  it("accepts a single calendar day", () => {
    const r = resolveActivityLogFirestoreBounds("2026-03-10", "2026-03-10");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.createdFrom.toMillis()).toBeLessThanOrEqual(r.createdTo.toMillis());
  });

  it("rejects when span exceeds 90 days", () => {
    const r = resolveActivityLogFirestoreBounds("2026-01-01", "2026-05-15");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errorMessage).toContain("90");
  });

  it("propagates invalid YMD from parseExportCreatedBounds", () => {
    const r = resolveActivityLogFirestoreBounds("not-a-date", "2026-01-01");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errorMessage).toContain("صيغة التاريخ");
  });

  it("caps open-ended lower bound to 90 days or now", () => {
    const nowMs = new Date("2026-06-15T12:00:00.000Z").getTime();
    vi.spyOn(Date, "now").mockReturnValue(nowMs);
    const r = resolveActivityLogFirestoreBounds("2026-01-01", "");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const maxSpan = r.createdTo.toMillis() - r.createdFrom.toMillis();
    expect(maxSpan).toBeLessThanOrEqual(90 * 24 * 60 * 60 * 1000 + 1000);
    expect(r.createdTo.toMillis()).toBeLessThanOrEqual(nowMs);
    vi.restoreAllMocks();
  });
});
