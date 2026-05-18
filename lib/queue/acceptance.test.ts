import { describe, expect, it } from "vitest";
import { emptyDailyStats } from "@/lib/queue/daily-stats-service";
import {
  computeTotalNoShow,
  isQueueNumberSearch,
  nextQueueNumber,
  parseQueueNumberSearch,
  shouldIncrementTotalCompleted,
  shouldSkipNewTicket,
} from "@/lib/queue/queue-logic";
import { normalizeRequestLookup, queueTicketId } from "@/lib/queue/queue-service";

/** In-memory model mirroring createQueueTicket / completeQueueTicket / closeDailyQueue. */
class QueueDaySimulator {
  private tickets = new Map<string, {
    queueNumber: number;
    status: "waiting" | "completed";
    requestId: string;
    officeId: string;
    queueDate: string;
  }>();

  private stats = new Map<
    string,
    {
      lastQueueNumber: number;
      totalCheckedIn: number;
      totalCompleted: number;
      totalNewRequests: number;
      closed: boolean;
    }
  >();

  private requests = new Set<string>();

  private statsKey(date: string, officeId: string) {
    return `${date}_${officeId}`;
  }

  checkIn(args: {
    requestId: string;
    officeId: string;
    queueDate: string;
    createdFrom: "existing_request" | "new_request";
  }) {
    const ticketId = queueTicketId({
      requestId: args.requestId,
      officeId: args.officeId,
      queueDate: args.queueDate,
    });
    const key = this.statsKey(args.queueDate, args.officeId);
    const stats = this.stats.get(key) ?? {
      lastQueueNumber: 0,
      totalCheckedIn: 0,
      totalCompleted: 0,
      totalNewRequests: 0,
      closed: false,
    };
    if (stats.closed) throw new Error("closed");

    const existing = this.tickets.get(ticketId);
    if (shouldSkipNewTicket(Boolean(existing))) {
      return { ticketId, queueNumber: existing!.queueNumber, created: false };
    }

    const queueNumber = nextQueueNumber(stats.lastQueueNumber);
    stats.lastQueueNumber = queueNumber;
    stats.totalCheckedIn += 1;
    if (args.createdFrom === "new_request") stats.totalNewRequests += 1;
    this.stats.set(key, stats);
    this.tickets.set(ticketId, {
      queueNumber,
      status: "waiting",
      requestId: args.requestId,
      officeId: args.officeId,
      queueDate: args.queueDate,
    });
    return { ticketId, queueNumber, created: true };
  }

  complete(ticketId: string) {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error("missing");
    const key = this.statsKey(ticket.queueDate, ticket.officeId);
    const stats = this.stats.get(key)!;
    if (!shouldIncrementTotalCompleted(ticket.status)) {
      return { incremented: false };
    }
    ticket.status = "completed";
    stats.totalCompleted += 1;
    return { incremented: true };
  }

  closeDay(officeId: string, queueDate: string) {
    const key = this.statsKey(queueDate, officeId);
    const stats = this.stats.get(key) ?? {
      lastQueueNumber: 0,
      totalCheckedIn: 0,
      totalCompleted: 0,
      totalNewRequests: 0,
      closed: false,
    };
    const totalNoShow = computeTotalNoShow(
      stats.totalCheckedIn,
      stats.totalCompleted,
    );
    this.stats.set(key, { ...stats, closed: true, totalNoShow } as typeof stats & {
      totalNoShow: number;
    });

    let deleted = 0;
    for (const [id, t] of this.tickets) {
      if (t.officeId === officeId && t.queueDate === queueDate) {
        this.tickets.delete(id);
        deleted += 1;
      }
    }
    return { deleted, totalNoShow, statsPreserved: true };
  }

  createRequest(id: string) {
    this.requests.add(id);
  }

  getStats(officeId: string, queueDate: string) {
    return this.stats.get(this.statsKey(queueDate, officeId));
  }

  hasTicket(ticketId: string) {
    return this.tickets.has(ticketId);
  }

  requestCount() {
    return this.requests.size;
  }
}

describe("acceptance: duplicate QR check-in", () => {
  it("returns the same queue number on second check-in", () => {
    const sim = new QueueDaySimulator();
    const first = sim.checkIn({
      requestId: "req-1",
      officeId: "office-a",
      queueDate: "2026-05-17",
      createdFrom: "existing_request",
    });
    const second = sim.checkIn({
      requestId: "req-1",
      officeId: "office-a",
      queueDate: "2026-05-17",
      createdFrom: "existing_request",
    });
    expect(second.queueNumber).toBe(first.queueNumber);
    expect(second.created).toBe(false);
    expect(sim.getStats("office-a", "2026-05-17")?.totalCheckedIn).toBe(1);
  });
});

describe("acceptance: first check-in of the day", () => {
  it("assigns queue number 1", () => {
    const sim = new QueueDaySimulator();
    const empty = emptyDailyStats("2026-05-17", "office-a");
    expect(nextQueueNumber(empty.lastQueueNumber)).toBe(1);

    const first = sim.checkIn({
      requestId: "req-1",
      officeId: "office-a",
      queueDate: "2026-05-17",
      createdFrom: "existing_request",
    });
    expect(first.queueNumber).toBe(1);
  });
});

describe("acceptance: quick request flow", () => {
  it("creates request then queue ticket with new_request stats", () => {
    const sim = new QueueDaySimulator();
    sim.createRequest("req-new");
    const ticket = sim.checkIn({
      requestId: "req-new",
      officeId: "office-a",
      queueDate: "2026-05-17",
      createdFrom: "new_request",
    });
    expect(ticket.queueNumber).toBe(1);
    expect(sim.getStats("office-a", "2026-05-17")?.totalNewRequests).toBe(1);
    expect(sim.requestCount()).toBe(1);
  });
});

describe("acceptance: staff search", () => {
  it("detects queue number vs CQM request number lookup", () => {
    expect(isQueueNumberSearch("12")).toBe(true);
    expect(parseQueueNumberSearch("12")).toBe(12);
    expect(isQueueNumberSearch("CQM-000012")).toBe(false);

    const lookup = normalizeRequestLookup("CQM-000012");
    expect(lookup.requestNumbers).toContain("CQM-000012");

    const officeScopedLookup = normalizeRequestLookup("cairo-trav-17-000001");
    expect(officeScopedLookup.requestNumbers).toContain(
      "cairo-trav-17-000001",
    );
  });
});

describe("acceptance: complete twice", () => {
  it("does not increment totalCompleted twice", () => {
    const sim = new QueueDaySimulator();
    const { ticketId } = sim.checkIn({
      requestId: "req-1",
      officeId: "office-a",
      queueDate: "2026-05-17",
      createdFrom: "existing_request",
    });
    expect(sim.complete(ticketId).incremented).toBe(true);
    expect(sim.complete(ticketId).incremented).toBe(false);
    expect(sim.getStats("office-a", "2026-05-17")?.totalCompleted).toBe(1);
  });
});

describe("acceptance: close day", () => {
  it("keeps daily stats and deletes only today_queue tickets", () => {
    const sim = new QueueDaySimulator();
    sim.createRequest("req-1");
    const { ticketId } = sim.checkIn({
      requestId: "req-1",
      officeId: "office-a",
      queueDate: "2026-05-17",
      createdFrom: "existing_request",
    });
    sim.complete(ticketId);

    const result = sim.closeDay("office-a", "2026-05-17");
    expect(result.deleted).toBe(1);
    expect(sim.hasTicket(ticketId)).toBe(false);
    expect(sim.getStats("office-a", "2026-05-17")?.closed).toBe(true);
    expect(sim.getStats("office-a", "2026-05-17")?.totalCheckedIn).toBe(1);
    expect(sim.requestCount()).toBe(1);
    expect(result.totalNoShow).toBe(0);
  });
});
