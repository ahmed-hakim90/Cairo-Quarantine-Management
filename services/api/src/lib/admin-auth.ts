import type { FastifyRequest } from "fastify";
import { ApiError } from "./errors.js";

const ADMIN_HEADER = "authorization";

/**
 * Server-to-server admin auth (Vercel → VPS API).
 * During Firebase migration, also accept Firebase ID tokens (future).
 */
export function assertAdminRequest(
  request: FastifyRequest,
  adminApiSecret: string,
): void {
  if (!adminApiSecret) {
    throw new ApiError(
      "admin_not_configured",
      "ADMIN_API_SECRET is not configured",
      503,
    );
  }

  const auth = request.headers[ADMIN_HEADER];
  const value = typeof auth === "string" ? auth : "";
  const token = value.startsWith("Bearer ") ? value.slice(7).trim() : value.trim();

  if (!token || token !== adminApiSecret) {
    throw new ApiError("unauthorized", "Invalid admin credentials", 401);
  }
}
