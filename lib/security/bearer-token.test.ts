import { describe, expect, it } from "vitest";
import { bearerToken, safeTokenEquals } from "@/lib/security/bearer-token";

describe("bearerToken", () => {
  it("extracts bearer tokens case-insensitively", () => {
    const request = new Request("https://example.gov.eg/api/cron", {
      headers: { authorization: "Bearer secret-value" },
    });

    expect(bearerToken(request)).toBe("secret-value");
  });
});

describe("safeTokenEquals", () => {
  it("accepts matching tokens and rejects different or empty tokens", () => {
    expect(safeTokenEquals("abc123", "abc123")).toBe(true);
    expect(safeTokenEquals("abc123", "abc124")).toBe(false);
    expect(safeTokenEquals("", "abc123")).toBe(false);
  });
});
