import type { FastifyInstance } from "fastify";
import {
  abortIdempotentRequest,
  beginIdempotentRequest,
  checkRedisRateLimit,
  clientIpFromHeaders,
  completeIdempotentRequest,
  getRedis,
  type ServiceConfig,
} from "@cqm/shared";
import { isApiError } from "../../lib/errors.js";
import type { CheckinBody } from "../../services/checkin.js";
import { processCheckin } from "../../services/checkin.js";
import { createOfficeRequest } from "../../services/create-request.js";
import { getBookingAvailability } from "../../services/booking-availability.js";
import { getQueueTicketState } from "../../services/queue-position.js";
import {
  deleteQueueWatchPg,
  registerQueueWatchPg,
} from "../../services/queue-watches.js";
import type { OfficeRequestType } from "../../lib/domain.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REQUEST_TYPES: OfficeRequestType[] = ["booking", "complaint", "proposal"];

function idempotencyKeyFromHeaders(
  headers: Record<string, unknown>,
): string | null {
  const raw = headers["idempotency-key"] ?? headers["x-idempotency-key"];
  const value = typeof raw === "string" ? raw.trim() : "";
  return value.length > 0 && value.length <= 200 ? value : null;
}

export async function registerPublicV1Routes(
  app: FastifyInstance,
  config: ServiceConfig,
): Promise<void> {
  const redis = getRedis(config.redisUrl);

  app.get("/v1/booking-availability", async (request, reply) => {
    const rate = await checkRedisRateLimit(redis, {
      key: clientIpFromHeaders(request.headers, "booking-availability"),
      limit: 60,
      windowSeconds: 60,
    });
    if (!rate.allowed) {
      return reply
        .code(429)
        .header("Retry-After", String(rate.retryAfterSeconds))
        .send({ error: "rate_limited" });
    }

    const query = request.query as { officeId?: string; preferredDate?: string };
    const officeId = query.officeId?.trim() ?? "";
    const preferredDate = query.preferredDate?.trim() ?? "";

    if (
      !officeId ||
      officeId.length > 120 ||
      !DATE_RE.test(preferredDate)
    ) {
      return reply.code(400).send({ error: "bad_params" });
    }

    try {
      const result = await getBookingAvailability({
        databaseUrl: config.databaseUrl,
        officeId,
        preferredDate,
      });
      return result;
    } catch (e) {
      if (isApiError(e)) {
        return reply
          .code(e.statusCode)
          .send({ error: e.code, message: e.message });
      }
      request.log.error(e);
      return reply.code(500).send({ error: "server" });
    }
  });

  app.post("/v1/requests", async (request, reply) => {
    const rate = await checkRedisRateLimit(redis, {
      key: clientIpFromHeaders(request.headers, "create-request"),
      limit: 10,
      windowSeconds: 600,
    });
    if (!rate.allowed) {
      return reply
        .code(429)
        .header("Retry-After", String(rate.retryAfterSeconds))
        .send({ error: "rate_limited" });
    }

    const body = request.body as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return reply.code(400).send({ error: "bad_params" });
    }

    const type = String(body.type ?? "").trim() as OfficeRequestType;
    if (!REQUEST_TYPES.includes(type)) {
      return reply.code(400).send({ error: "bad_params" });
    }

    const idempotencyKey = idempotencyKeyFromHeaders(
      request.headers as Record<string, unknown>,
    );
    if (idempotencyKey) {
      const lock = await beginIdempotentRequest(redis, "create-request", idempotencyKey);
      if (lock.kind === "replay") {
        return reply.code(200).send(lock.response);
      }
      if (lock.kind === "in_flight") {
        return reply.code(409).send({ error: "request_in_flight" });
      }
    }

    try {
      const created = await createOfficeRequest({
        databaseUrl: config.databaseUrl,
        input: {
          governorateId: String(body.governorateId ?? ""),
          officeId: String(body.officeId ?? ""),
          type,
          travelerStateId: body.travelerStateId
            ? String(body.travelerStateId)
            : undefined,
          preferredDate: body.preferredDate
            ? String(body.preferredDate)
            : undefined,
          name: String(body.name ?? ""),
          phone: String(body.phone ?? ""),
          details: String(body.details ?? ""),
          hasSpecialNeeds: body.hasSpecialNeeds === true,
          hasElderly: body.hasElderly === true,
        },
      });

      if (idempotencyKey) {
        await completeIdempotentRequest(redis, "create-request", idempotencyKey, created);
      }
      return reply.code(201).send(created);
    } catch (e) {
      if (idempotencyKey) {
        await abortIdempotentRequest(redis, "create-request", idempotencyKey);
      }
      if (isApiError(e)) {
        return reply
          .code(e.statusCode)
          .send({ error: e.code, message: e.message });
      }
      request.log.error(e);
      return reply.code(500).send({ error: "server" });
    }
  });

  app.post("/v1/checkin", async (request, reply) => {
    const rate = await checkRedisRateLimit(redis, {
      key: clientIpFromHeaders(request.headers, "checkin"),
      limit: 30,
      windowSeconds: 600,
    });
    if (!rate.allowed) {
      return reply
        .code(429)
        .header("Retry-After", String(rate.retryAfterSeconds))
        .send({ error: "rate_limited" });
    }

    const body = request.body as CheckinBody | null;
    if (!body || typeof body !== "object" || !body.mode) {
      return reply.code(400).send({ error: "bad_params" });
    }

    try {
      const result = await processCheckin({
        databaseUrl: config.databaseUrl,
        redis,
        body,
      });
      if (!result.ok) {
        const code = result.needsQuickForm ? 404 : 400;
        return reply.code(code).send(result);
      }
      return result;
    } catch (e) {
      if (isApiError(e)) {
        return reply
          .code(e.statusCode)
          .send({ error: e.code, message: e.message });
      }
      request.log.error(e);
      return reply.code(500).send({ error: "server" });
    }
  });

  app.post("/v1/queue/watch", async (request, reply) => {
    const rate = await checkRedisRateLimit(redis, {
      key: clientIpFromHeaders(request.headers, "queue-watch"),
      limit: 30,
      windowSeconds: 60,
    });
    if (!rate.allowed) {
      return reply
        .code(429)
        .header("Retry-After", String(rate.retryAfterSeconds))
        .send({ error: "rate_limited" });
    }

    const body = request.body as Record<string, unknown> | null;
    const ticketId = String(body?.ticketId ?? "").trim();
    const fcmToken = String(body?.fcmToken ?? "").trim();
    if (!ticketId || !fcmToken) {
      return reply.code(400).send({ error: "bad_params" });
    }

    try {
      await registerQueueWatchPg({
        databaseUrl: config.databaseUrl,
        ticketId,
        fcmToken,
      });
      return { ok: true };
    } catch (e) {
      if (isApiError(e)) {
        return reply
          .code(e.statusCode)
          .send({ error: e.code, message: e.message });
      }
      request.log.error(e);
      return reply.code(500).send({ error: "server" });
    }
  });

  app.delete("/v1/queue/watch", async (request, reply) => {
    const rate = await checkRedisRateLimit(redis, {
      key: clientIpFromHeaders(request.headers, "queue-watch"),
      limit: 30,
      windowSeconds: 60,
    });
    if (!rate.allowed) {
      return reply
        .code(429)
        .header("Retry-After", String(rate.retryAfterSeconds))
        .send({ error: "rate_limited" });
    }

    const query = request.query as { ticketId?: string };
    const ticketId = String(query.ticketId ?? "").trim();
    if (!ticketId) {
      return reply.code(400).send({ error: "bad_params" });
    }

    try {
      await deleteQueueWatchPg({ databaseUrl: config.databaseUrl, ticketId });
      return { ok: true };
    } catch (e) {
      if (isApiError(e)) {
        return reply
          .code(e.statusCode)
          .send({ error: e.code, message: e.message });
      }
      request.log.error(e);
      return reply.code(500).send({ error: "server" });
    }
  });

  app.get("/v1/queue/tickets/:ticketId/state", async (request, reply) => {
    const { ticketId } = request.params as { ticketId: string };
    if (!ticketId?.trim()) {
      return reply.code(400).send({ error: "bad_params" });
    }

    const rate = await checkRedisRateLimit(redis, {
      key: clientIpFromHeaders(request.headers, "queue-state"),
      limit: 120,
      windowSeconds: 60,
    });
    if (!rate.allowed) {
      return reply
        .code(429)
        .header("Retry-After", String(rate.retryAfterSeconds))
        .send({ error: "rate_limited" });
    }

    try {
      const state = await getQueueTicketState({
        databaseUrl: config.databaseUrl,
        redis,
        ticketId,
      });
      return state;
    } catch (e) {
      if (isApiError(e)) {
        return reply
          .code(e.statusCode)
          .send({ error: e.code, message: e.message });
      }
      request.log.error(e);
      return reply.code(500).send({ error: "server" });
    }
  });
}
