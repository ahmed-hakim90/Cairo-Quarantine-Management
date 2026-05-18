import type { FastifyInstance } from "fastify";
import { getRedis, type ServiceConfig } from "@cqm/shared";
import { assertAdminRequest } from "../../lib/admin-auth.js";
import { isApiError } from "../../lib/errors.js";
import type { OfficeRequestStatus } from "../../lib/domain.js";
import {
  listAdminRequests,
  parseAdminRequestsSort,
  parseAdminScopeFromQuery,
  parseIsoDateParam,
  parseStatusFilter,
  parseTypeFilter,
  updateAdminRequest,
} from "../../services/admin-requests.js";
import { addRequestToQueueForAdmin } from "../../services/add-request-to-queue.js";
import { completeQueueTicket } from "../../services/complete-ticket.js";
import {
  listActivityLogs,
  listLatestActivityLogsByRequestIds,
  parseActivityLogScopeFromQuery,
} from "../../services/activity-logs.js";
import {
  listRequestsForAdminExport,
  parseExportDateBounds,
} from "../../services/admin-export.js";
import type { OfficeRequestType, TravelerCategory } from "../../lib/domain.js";

export async function registerAdminV1Routes(
  app: FastifyInstance,
  config: ServiceConfig,
): Promise<void> {
  const redis = getRedis(config.redisUrl);

  app.addHook("preHandler", async (request, reply) => {
    if (!request.url.startsWith("/v1/admin")) return;
    try {
      assertAdminRequest(request, config.adminApiSecret);
    } catch (e) {
      if (isApiError(e)) {
        return reply.code(e.statusCode).send({ error: e.code, message: e.message });
      }
      throw e;
    }
  });

  app.get("/v1/admin/requests", async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    const scope = parseAdminScopeFromQuery(query);
    const status = parseStatusFilter(query.status);
    const type = parseTypeFilter(query.type);
    const limitRaw = Number.parseInt(String(query.limit ?? "100"), 10);

    if (query.status && status === undefined) {
      return reply.code(400).send({ error: "bad_params" });
    }
    if (query.type && type === undefined) {
      return reply.code(400).send({ error: "bad_params" });
    }

    const updatedFrom = parseIsoDateParam(query.updatedFrom);
    const updatedTo = parseIsoDateParam(query.updatedTo);
    if (
      (query.updatedFrom && !updatedFrom) ||
      (query.updatedTo && !updatedTo)
    ) {
      return reply.code(400).send({ error: "bad_params" });
    }

    try {
      const result = await listAdminRequests({
        databaseUrl: config.databaseUrl,
        scope,
        status: status ?? "all",
        type: type ?? "all",
        officeFilter: String(query.officeFilter ?? "").trim() || undefined,
        limit: Number.isFinite(limitRaw) ? limitRaw : 100,
        cursor: String(query.cursor ?? "") || null,
        q: String(query.q ?? "").trim() || undefined,
        sort: parseAdminRequestsSort(query.sort),
        updatedFrom,
        updatedTo,
        adminBookingTodayYmd:
          String(query.adminBookingTodayYmd ?? "").trim() || null,
        bookingDateFrom: String(query.bookingDateFrom ?? "").trim() || null,
        bookingDateTo: String(query.bookingDateTo ?? "").trim() || null,
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

  app.patch("/v1/admin/requests/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown> | null;
    if (!id?.trim() || !body) {
      return reply.code(400).send({ error: "bad_params" });
    }

    const status = String(body.status ?? "").trim() as OfficeRequestStatus;
    const notes = String(body.notes ?? "");
    const actorUid = String(body.actorUid ?? "admin-api").trim();
    const actorLabel = String(body.actorLabel ?? "VPS Admin API").trim();
    const scope = parseAdminScopeFromQuery(
      (body.scope as Record<string, unknown> | undefined) ?? {},
    );

    try {
      const updated = await updateAdminRequest({
        databaseUrl: config.databaseUrl,
        scope,
        id: id.trim(),
        status,
        notes,
        actorUid,
        actorLabel,
      });
      return updated;
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

  app.post("/v1/admin/queue/from-request", async (request, reply) => {
    const body = request.body as Record<string, unknown> | null;
    const requestId = String(body?.requestId ?? "").trim();
    if (!requestId) {
      return reply.code(400).send({ error: "bad_params" });
    }

    const scope = parseAdminScopeFromQuery(
      (body?.scope as Record<string, unknown> | undefined) ?? {},
    );

    try {
      const result = await addRequestToQueueForAdmin({
        databaseUrl: config.databaseUrl,
        redis,
        scope,
        requestId,
        date: String(body?.date ?? "").trim() || undefined,
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

  app.get("/v1/admin/activity-logs", async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    const scope = parseActivityLogScopeFromQuery(query);
    const limitRaw = Number.parseInt(String(query.limit ?? "100"), 10);
    const createdFrom = parseIsoDateParam(query.createdFrom);
    const createdTo = parseIsoDateParam(query.createdTo);
    if (
      (query.createdFrom && !createdFrom) ||
      (query.createdTo && !createdTo)
    ) {
      return reply.code(400).send({ error: "bad_params" });
    }

    const requestIdsRaw = String(query.requestIds ?? "").trim();
    if (requestIdsRaw) {
      const requestIds = requestIdsRaw.split(",").map((s) => s.trim()).filter(Boolean);
      try {
        const latest = await listLatestActivityLogsByRequestIds({
          databaseUrl: config.databaseUrl,
          requestIds,
        });
        return latest;
      } catch (e) {
        if (isApiError(e)) {
          return reply
            .code(e.statusCode)
            .send({ error: e.code, message: e.message });
        }
        request.log.error(e);
        return reply.code(500).send({ error: "server" });
      }
    }

    try {
      const result = await listActivityLogs({
        databaseUrl: config.databaseUrl,
        scope,
        limit: Number.isFinite(limitRaw) ? limitRaw : 100,
        cursor: String(query.cursor ?? "") || null,
        createdFrom,
        createdTo,
        officeFilter: String(query.officeFilter ?? "").trim() || null,
        actorUid: String(query.actorUid ?? "").trim() || null,
        requestId: String(query.requestId ?? "").trim() || null,
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

  app.get("/v1/admin/export/requests", async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    const scope = parseAdminScopeFromQuery(query);
    const bounds = parseExportDateBounds(query.createdFrom, query.createdTo);
    if (bounds === null) {
      return reply.code(400).send({ error: "bad_params" });
    }

    const typeTokens = String(query.types ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const VALID_TYPES = new Set<OfficeRequestType>([
      "booking",
      "complaint",
      "proposal",
    ]);
    const types = (
      typeTokens.length > 0
        ? typeTokens.filter((t): t is OfficeRequestType =>
            VALID_TYPES.has(t as OfficeRequestType),
          )
        : (["booking", "complaint", "proposal"] as OfficeRequestType[])
    ) as OfficeRequestType[];

    const travelerTokens = [
      ...String(query.travelerStateIds ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      ...String(query.travelerCategories ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ];
    const includeUncategorized = travelerTokens.some(
      (t) => t.toLowerCase() === "uncategorized",
    );
    const VALID_TRAVELER = new Set<TravelerCategory>([
      "international",
      "hajj_umrah",
      "citizen",
    ]);
    const travelerStateIds = travelerTokens.filter(
      (t) => t.toLowerCase() !== "uncategorized" && !VALID_TRAVELER.has(t as TravelerCategory),
    );
    const travelerCategories = travelerTokens.filter((t): t is TravelerCategory =>
      VALID_TRAVELER.has(t as TravelerCategory),
    );

    const officeRaw = String(query.officeId ?? "").trim();
    const officeId =
      !officeRaw || officeRaw.toLowerCase() === "all" ? null : officeRaw;
    const officeIdsRaw = String(query.officeIds ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const includeUncategorizedParam =
      String(query.includeUncategorized ?? "").toLowerCase() === "true" ||
      includeUncategorized;

    try {
      const result = await listRequestsForAdminExport({
        databaseUrl: config.databaseUrl,
        scope,
        filters: {
          types,
          officeId,
          officeIds: officeIdsRaw.length > 0 ? officeIdsRaw : null,
          travelerStateIds,
          travelerCategories,
          includeUncategorizedBookings: includeUncategorizedParam,
          createdFrom: bounds.createdFrom,
          createdTo: bounds.createdTo,
          adminBookingTodayYmd:
            String(query.adminBookingTodayYmd ?? "").trim() || null,
        },
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

  app.post("/v1/admin/queue/tickets/:ticketId/complete", async (request, reply) => {
    const { ticketId } = request.params as { ticketId: string };
    if (!ticketId?.trim()) {
      return reply.code(400).send({ error: "bad_params" });
    }

    try {
      const ticket = await completeQueueTicket({
        databaseUrl: config.databaseUrl,
        redis,
        ticketId,
      });
      return ticket;
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
