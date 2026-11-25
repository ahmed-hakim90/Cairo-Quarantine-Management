import { describe, expect, it } from "vitest";
import { adminPasswordProblem } from "@/lib/office-requests/admin-password-policy";

describe("adminPasswordProblem", () => {
  it("rejects short numeric passwords like 123456", () => {
    expect(adminPasswordProblem("123456")).not.toBeNull();
  });

  it("rejects long passwords without both letters and digits", () => {
    expect(adminPasswordProblem("1234567890")).not.toBeNull();
    expect(adminPasswordProblem("abcdefghijk")).not.toBeNull();
  });

  it("rejects repetitive passwords", () => {
    expect(adminPasswordProblem("aaaaa11111")).not.toBeNull();
  });

  it("accepts a mixed password of sufficient length", () => {
    expect(adminPasswordProblem("Cairo2026Quar")).toBeNull();
  });

  it("accepts Arabic letters with digits", () => {
    expect(adminPasswordProblem("حجرصحي2026مكتب")).toBeNull();
  });
});
