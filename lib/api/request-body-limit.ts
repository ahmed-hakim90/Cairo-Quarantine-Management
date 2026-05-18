const DEFAULT_MAX_BYTES = 32_768;

export function isRequestBodyTooLarge(
  req: Request,
  maxBytes = DEFAULT_MAX_BYTES,
): boolean {
  const raw = req.headers.get("content-length");
  if (!raw) return false;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > maxBytes;
}

export function bodyTooLargeResponse(): Response {
  return new Response(JSON.stringify({ error: "payload_too_large" }), {
    status: 413,
    headers: { "Content-Type": "application/json" },
  });
}
