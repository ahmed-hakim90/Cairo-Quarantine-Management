import { describe, expect, it } from "vitest";
import {
  ADMIN_REQUEST_HEADER,
  ADMIN_REQUEST_HEADER_VALUE,
  rejectOversizedRequest,
  rejectUnsafeAdminRequest,
} from "@/lib/security/admin-request";

function request(headers: Record<string, string> = {}) {
  return new Request("https://example.gov.eg/api/admin/session", { headers });
}

describe("rejectUnsafeAdminRequest", () => {
  it("allows same-origin admin fetches with the internal header", () => {
    expect(
      rejectUnsafeAdminRequest(
        request({
          origin: "https://example.gov.eg",
          "sec-fetch-site": "same-origin",
          [ADMIN_REQUEST_HEADER]: ADMIN_REQUEST_HEADER_VALUE,
        }),
      ),
    ).toBeNull();
  });

  it("rejects cross-site requests even with the internal header", async () => {
    const response = rejectUnsafeAdminRequest(
      request({
        origin: "https://attacker.example",
        "sec-fetch-site": "cross-site",
        [ADMIN_REQUEST_HEADER]: ADMIN_REQUEST_HEADER_VALUE,
      }),
    );

    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toEqual({
      error: "forbidden_origin",
    });
  });

  it("rejects requests missing the internal admin header", async () => {
    const response = rejectUnsafeAdminRequest(
      request({
        origin: "https://example.gov.eg",
        "sec-fetch-site": "same-origin",
      }),
    );

    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toEqual({
      error: "missing_admin_request_header",
    });
  });
});

describe("rejectOversizedRequest", () => {
  it("rejects requests over the configured content-length", async () => {
    const response = rejectOversizedRequest(
      request({ "content-length": "4097" }),
      4096,
    );

    expect(response?.status).toBe(413);
    await expect(response?.json()).resolves.toEqual({
      error: "request_body_too_large",
    });
  });

  it("allows requests without a parseable content-length", () => {
    expect(rejectOversizedRequest(request(), 4096)).toBeNull();
  });
});
