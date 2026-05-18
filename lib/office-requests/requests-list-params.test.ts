import { describe, expect, it } from "vitest";
import {
  buildAdminRequestsHref,
  coerceSortForUpdatedWindow,
  parseAdminRequestsSort,
  parseAdminRequestsStatus,
  sortToFirestore,
} from "@/lib/office-requests/requests-list-params";

describe("requests-list-params", () => {
  it("parses status", () => {
    expect(parseAdminRequestsStatus(undefined)).toBe("all");
    expect(parseAdminRequestsStatus("all")).toBe("all");
    expect(parseAdminRequestsStatus("new")).toBe("new");
    expect(parseAdminRequestsStatus("in_progress")).toBe("in_progress");
    expect(parseAdminRequestsStatus("bogus")).toBe("all");
  });

  it("parses sort", () => {
    expect(parseAdminRequestsSort(undefined)).toBe("created_desc");
    expect(parseAdminRequestsSort("updated_asc")).toBe("updated_asc");
    expect(parseAdminRequestsSort("invalid")).toBe("created_desc");
  });

  it("maps sort to Firestore fields", () => {
    expect(sortToFirestore("created_desc")).toEqual({
      sortKey: "createdAt",
      sortDirection: "desc",
    });
    expect(sortToFirestore("created_asc")).toEqual({
      sortKey: "createdAt",
      sortDirection: "asc",
    });
    expect(sortToFirestore("updated_desc")).toEqual({
      sortKey: "updatedAt",
      sortDirection: "desc",
    });
    expect(sortToFirestore("updated_asc")).toEqual({
      sortKey: "updatedAt",
      sortDirection: "asc",
    });
  });

  it("coerces created sorts when updated window is active", () => {
    expect(coerceSortForUpdatedWindow("created_desc", false)).toBe(
      "created_desc",
    );
    expect(coerceSortForUpdatedWindow("created_desc", true)).toBe(
      "updated_desc",
    );
    expect(coerceSortForUpdatedWindow("created_asc", true)).toBe("updated_asc");
    expect(coerceSortForUpdatedWindow("updated_desc", true)).toBe(
      "updated_desc",
    );
  });

  it("buildAdminRequestsHref preserves non-default params", () => {
    expect(
      buildAdminRequestsHref("/ar/admin/requests", {
        q: "01552900017",
        status: "new",
        sort: "updated_desc",
        range: "today",
        cursor: "abc",
      }),
    ).toBe(
      "/ar/admin/requests?q=01552900017&status=new&sort=updated_desc&range=today&cursor=abc",
    );
    expect(
      buildAdminRequestsHref("/ar/admin/requests", {
        status: "all",
        sort: "created_desc",
      }),
    ).toBe("/ar/admin/requests");
    expect(
      buildAdminRequestsHref("/ar/admin/requests", {
        from: "2026-01-01",
        to: "2026-01-31",
        status: "contacted",
      }),
    ).toBe(
      "/ar/admin/requests?status=contacted&from=2026-01-01&to=2026-01-31",
    );
  });
});
