import { describe, expect, it } from "vitest";
import { formatSiteVisitorDisplay } from "@/lib/site-stats/display";

describe("formatSiteVisitorDisplay", () => {
  it("shows 100+ below minimum", () => {
    expect(formatSiteVisitorDisplay(0, "ar")).toBe("100+");
    expect(formatSiteVisitorDisplay(99, "en")).toBe("100+");
  });

  it("shows formatted count with plus at or above minimum", () => {
    expect(formatSiteVisitorDisplay(100, "en")).toBe("100+");
    expect(formatSiteVisitorDisplay(1234, "en")).toMatch(/\+$/);
    expect(formatSiteVisitorDisplay(1234, "en")).toContain("1");
  });
});
