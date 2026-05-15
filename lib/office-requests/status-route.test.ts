import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/office-requests/status/route";
import { resetRateLimitForTests } from "@/lib/rate-limit";

function jsonRequest(body: unknown, ip = "203.0.113.20") {
  return new Request("https://example.test/api/office-requests/status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("office request status route hardening", () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });

  it("rejects invalid lookup payloads before querying", async () => {
    const response = await POST(
      jsonRequest({ requests: [{ id: "", phone: "201000000000" }] }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid request lookup.",
    });
  });

  it("rejects more than 20 lookups", async () => {
    const response = await POST(
      jsonRequest({
        requests: Array.from({ length: 21 }, (_, i) => ({
          id: `request-${i}`,
          phone: "201000000000",
        })),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Too many requests.",
    });
  });

  it("returns 429 after too many refresh attempts", async () => {
    let response = await POST(jsonRequest({ requests: [] }));
    for (let i = 0; i < 30; i += 1) {
      response = await POST(jsonRequest({ requests: [] }));
    }

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    await expect(response.json()).resolves.toMatchObject({
      error: "rate_limited",
    });
  });
});
