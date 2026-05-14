import { getPublicRequestStatus } from "@/lib/office-requests/store";
import type { PublicOfficeRequestStatus } from "@/lib/office-requests/types";

type StatusLookup = {
  id: string;
  phone: string;
};

function isLookup(value: unknown): value is StatusLookup {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.phone === "string";
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { requests: [], missing: [], error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const rawRequests = (body as { requests?: unknown })?.requests;
  if (!Array.isArray(rawRequests)) {
    return Response.json(
      { requests: [], missing: [], error: "requests must be an array." },
      { status: 400 },
    );
  }

  const lookups = rawRequests.filter(isLookup).slice(0, 20);
  const results = await Promise.all(
    lookups.map(async (lookup) => ({
      id: lookup.id,
      request: await getPublicRequestStatus(lookup),
    })),
  );

  const requests: PublicOfficeRequestStatus[] = [];
  const missing: string[] = [];

  for (const result of results) {
    if (result.request) {
      requests.push(result.request);
    } else {
      missing.push(result.id);
    }
  }

  return Response.json({ requests, missing });
}
