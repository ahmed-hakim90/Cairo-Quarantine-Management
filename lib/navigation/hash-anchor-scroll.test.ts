import { describe, expect, it } from "vitest";
import { officeIdFromHash } from "@/lib/navigation/hash-anchor-scroll";

describe("office hash scroll helpers", () => {
  it("parses office id from hash", () => {
    expect(officeIdFromHash("office-cairo-trav-14")).toBe("cairo-trav-14");
    expect(officeIdFromHash("destination-country-requirements")).toBeNull();
    expect(officeIdFromHash("office-")).toBeNull();
  });
});
