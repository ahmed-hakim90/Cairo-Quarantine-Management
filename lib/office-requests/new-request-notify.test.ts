import { describe, expect, it } from "vitest";
import {
  buildNotifyOfficeIdBatches,
  FIRESTORE_IN_QUERY_MAX,
  notifyScopeFromProfile,
  shouldNotifyRequest,
} from "@/lib/office-requests/new-request-notify";

describe("notifyScopeFromProfile", () => {
  it("gives super_admin empty office batches scope", () => {
    expect(
      notifyScopeFromProfile({
        role: "super_admin",
        officeId: null,
      }),
    ).toEqual({
      role: "super_admin",
      officeId: null,
      allowedOfficeIds: [],
    });
  });

  it("maps office_admin allowedOfficeIds", () => {
    expect(
      notifyScopeFromProfile({
        role: "office_admin",
        officeId: null,
        allowedOfficeIds: ["a", "b", "a"],
      }),
    ).toEqual({
      role: "office_admin",
      officeId: null,
      allowedOfficeIds: ["a", "b"],
    });
  });

  it("maps office_user to single office", () => {
    expect(
      notifyScopeFromProfile({
        role: "office_user",
        officeId: "office-1",
      }),
    ).toEqual({
      role: "office_user",
      officeId: "office-1",
      allowedOfficeIds: ["office-1"],
    });
  });
});

describe("buildNotifyOfficeIdBatches", () => {
  it("returns empty for super_admin", () => {
    expect(
      buildNotifyOfficeIdBatches({
        role: "super_admin",
        officeId: null,
        allowedOfficeIds: [],
      }),
    ).toEqual([]);
  });

  it("returns one batch for office_user", () => {
    expect(
      buildNotifyOfficeIdBatches({
        role: "office_user",
        officeId: "o1",
        allowedOfficeIds: ["o1"],
      }),
    ).toEqual([["o1"]]);
  });

  it("chunks office_admin offices at Firestore in limit", () => {
    const ids = Array.from({ length: FIRESTORE_IN_QUERY_MAX + 5 }, (_, i) =>
      String(i),
    );
    const batches = buildNotifyOfficeIdBatches({
      role: "office_admin",
      officeId: null,
      allowedOfficeIds: ids,
    });
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(FIRESTORE_IN_QUERY_MAX);
    expect(batches[1]).toHaveLength(5);
  });
});

describe("shouldNotifyRequest", () => {
  const base = { officeId: "office-a", status: "new" as const };

  it("allows super_admin for any office", () => {
    expect(
      shouldNotifyRequest(base, {
        role: "super_admin",
        officeId: null,
        allowedOfficeIds: [],
      }),
    ).toBe(true);
  });

  it("allows office_admin when office is allowed", () => {
    expect(
      shouldNotifyRequest(base, {
        role: "office_admin",
        officeId: null,
        allowedOfficeIds: ["office-a"],
      }),
    ).toBe(true);
  });

  it("denies office_admin for other offices", () => {
    expect(
      shouldNotifyRequest(base, {
        role: "office_admin",
        officeId: null,
        allowedOfficeIds: ["office-b"],
      }),
    ).toBe(false);
  });

  it("allows office_user for own office only", () => {
    expect(
      shouldNotifyRequest(base, {
        role: "office_user",
        officeId: "office-a",
        allowedOfficeIds: ["office-a"],
      }),
    ).toBe(true);
    expect(
      shouldNotifyRequest(base, {
        role: "office_user",
        officeId: "office-b",
        allowedOfficeIds: ["office-b"],
      }),
    ).toBe(false);
  });

  it("ignores non-new status", () => {
    expect(
      shouldNotifyRequest(
        { officeId: "office-a", status: "in_progress" },
        {
          role: "super_admin",
          officeId: null,
          allowedOfficeIds: [],
        },
      ),
    ).toBe(false);
  });
});
