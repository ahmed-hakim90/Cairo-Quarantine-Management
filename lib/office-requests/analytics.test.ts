import { describe, expect, it } from "vitest";
import {
  buildAdminAnalyticsFromAggregatedDailyStats,
  buildAdminRequestAnalytics,
  buildBookingQueueSection,
  buildFeedbackSectionFromDailyStats,
  buildFeedbackSectionFromRequests,
  buildOfficePerformanceRatings,
  buildOfficePerformanceFromDailyStats,
  topOfficesByComplaints,
  topOfficesByTotalRequests,
} from "@/lib/office-requests/analytics";
import type { DailyRequestStats } from "@/lib/office-requests/daily-request-stats";
import { aggregateDailyQueueStats } from "@/lib/queue/daily-stats-service";
import type { DailyStats } from "@/lib/queue/types";
import type { Office, OfficeRequest } from "@/lib/office-requests/types";

function office(id: string, nameAr = id): Office {
  return {
    id,
    governorateId: "cairo",
    serialInGovernorate: 1,
    administrationAr: "",
    nameAr,
    addressAr: "",
    phone: null,
    mapsUrl: "",
    service: "hajj_umrah_travelers",
    active: true,
  };
}

function request(
  id: string,
  officeId: string,
  status: OfficeRequest["status"],
  type: OfficeRequest["type"] = "booking",
): OfficeRequest {
  return {
    id,
    requestNumber: id,
    officeId,
    officeNameAr: officeId,
    type,
    status,
    name: "",
    phone: "",
    details: "",
    notes: "",
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-05-15T00:00:00.000Z",
  };
}

function queueRow(args: {
  checkedIn: number;
  completed: number;
  closed?: boolean;
  noShow?: number;
}): DailyStats {
  return {
    id: "2026-05-15_office-a",
    date: "2026-05-15",
    officeId: "office-a",
    totalCheckedIn: args.checkedIn,
    totalCompleted: args.completed,
    totalNoShow: args.noShow ?? 0,
    totalNewRequests: 0,
    lastQueueNumber: 0,
    closed: args.closed ?? false,
  };
}

describe("buildAdminRequestAnalytics", () => {
  it("counts contacted separately from in_progress", () => {
    const analytics = buildAdminRequestAnalytics([
      request("1", "office-a", "new"),
      request("2", "office-a", "contacted"),
      request("3", "office-a", "in_progress"),
    ]);
    expect(analytics.byStatus.new).toBe(1);
    expect(analytics.byStatus.contacted).toBe(1);
    expect(analytics.byStatus.in_progress).toBe(1);
  });
});

describe("buildOfficePerformanceRatings", () => {
  it("counts bookings and complaints per office", () => {
    const ratings = buildOfficePerformanceRatings(
      [
        request("1", "office-a", "completed"),
        request("2", "office-a", "new"),
        request("3", "office-a", "cancelled", "complaint"),
        request("4", "office-a", "new", "proposal"),
      ],
      [office("office-a", "مكتب أ")],
    );

    expect(ratings[0]).toMatchObject({
      officeId: "office-a",
      bookings: 2,
      complaints: 1,
      proposals: 1,
      completed: 1,
    });
  });

  it("keeps offices with no requests at zero", () => {
    const ratings = buildOfficePerformanceRatings([], [office("office-a")]);

    expect(ratings[0]).toMatchObject({
      officeId: "office-a",
      bookings: 0,
      complaints: 0,
    });
  });

  it("sorts by total activity, then bookings, then name", () => {
    const ratings = buildOfficePerformanceRatings(
      [
        request("1", "office-low", "completed"),
        request("2", "office-low", "cancelled", "complaint"),
        request("3", "office-high-bookings", "completed"),
        request("4", "office-high-bookings", "new"),
        request("5", "office-high-complaints", "new", "complaint"),
        request("6", "office-high-complaints", "new", "proposal"),
      ],
      [
        office("office-empty"),
        office("office-low"),
        office("office-high-bookings"),
        office("office-high-complaints"),
      ],
    );

    expect(ratings.map((rating) => rating.officeId)).toEqual([
      "office-high-bookings",
      "office-low",
      "office-high-complaints",
      "office-empty",
    ]);
  });
});

describe("buildOfficePerformanceFromDailyStats", () => {
  it("aggregates bookings and complaints per office", () => {
    const rows: DailyRequestStats[] = [
      {
        date: "2026-05-01",
        officeId: "office-a",
        totalRequests: 3,
        bookings: 2,
        complaints: 1,
        proposals: 0,
        new: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        bookingNew: 0,
        bookingInProgress: 0,
        bookingCompleted: 1,
        bookingCancelled: 0,
        complaintNew: 0,
        complaintInProgress: 0,
        complaintCompleted: 0,
        complaintCancelled: 0,
        proposalNew: 0,
        proposalInProgress: 0,
        proposalCompleted: 0,
        proposalCancelled: 0,
      },
      {
        date: "2026-05-02",
        officeId: "office-a",
        totalRequests: 1,
        bookings: 1,
        complaints: 0,
        proposals: 0,
        new: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        bookingNew: 0,
        bookingInProgress: 0,
        bookingCompleted: 0,
        bookingCancelled: 0,
        complaintNew: 0,
        complaintInProgress: 0,
        complaintCompleted: 0,
        complaintCancelled: 0,
        proposalNew: 0,
        proposalInProgress: 0,
        proposalCompleted: 0,
        proposalCancelled: 0,
      },
      {
        date: "2026-05-01",
        officeId: "office-b",
        totalRequests: 2,
        bookings: 0,
        complaints: 2,
        proposals: 0,
        new: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        bookingNew: 0,
        bookingInProgress: 0,
        bookingCompleted: 0,
        bookingCancelled: 0,
        complaintNew: 0,
        complaintInProgress: 0,
        complaintCompleted: 0,
        complaintCancelled: 0,
        proposalNew: 0,
        proposalInProgress: 0,
        proposalCompleted: 0,
        proposalCancelled: 0,
      },
    ];

    const ratings = buildOfficePerformanceFromDailyStats(rows, [
      office("office-a", "مكتب أ"),
      office("office-b", "مكتب ب"),
    ]);

    expect(ratings.find((row) => row.officeId === "office-a")).toMatchObject({
      bookings: 3,
      complaints: 1,
      completed: 1,
    });
    expect(ratings.find((row) => row.officeId === "office-b")).toMatchObject({
      bookings: 0,
      complaints: 2,
    });
  });
});

describe("top office chart rows", () => {
  it("returns top offices by total requests and complaints", () => {
    const ratings = buildOfficePerformanceRatings(
      [
        request("1", "office-a", "completed"),
        request("2", "office-a", "new"),
        request("3", "office-b", "new", "complaint"),
        request("4", "office-b", "new", "complaint"),
        request("5", "office-c", "new", "complaint"),
      ],
      [
        office("office-a", "مكتب أ"),
        office("office-b", "مكتب ب"),
        office("office-c", "مكتب ج"),
      ],
    );

    expect(topOfficesByTotalRequests(ratings, 2).map((row) => row.officeId)).toEqual([
      "office-a",
      "office-b",
    ]);
    expect(topOfficesByComplaints(ratings, 2).map((row) => row.count)).toEqual([2, 1]);
  });
});

describe("buildAdminAnalyticsFromAggregatedDailyStats", () => {
  it("maps aggregated daily stats to analytics", () => {
    const aggregated: DailyRequestStats = {
      date: "",
      officeId: "",
      totalRequests: 10,
      bookings: 6,
      complaints: 3,
      proposals: 1,
      new: 2,
      inProgress: 4,
      completed: 3,
      cancelled: 1,
      bookingNew: 1,
      bookingInProgress: 2,
      bookingCompleted: 2,
      bookingCancelled: 1,
      complaintNew: 1,
      complaintInProgress: 1,
      complaintCompleted: 1,
      complaintCancelled: 0,
      proposalNew: 0,
      proposalInProgress: 1,
      proposalCompleted: 0,
      proposalCancelled: 0,
    };
    const analytics = buildAdminAnalyticsFromAggregatedDailyStats(aggregated);
    expect(analytics.byStatus.completed).toBe(3);
    expect(analytics.byType.booking).toBe(6);
  });
});

describe("aggregateDailyQueueStats", () => {
  it("sums checked-in and completed and uses stored no-show when closed", () => {
    const aggregated = aggregateDailyQueueStats([
      queueRow({ checkedIn: 10, completed: 7, closed: true, noShow: 3 }),
      queueRow({ checkedIn: 5, completed: 2, closed: false }),
    ]);
    expect(aggregated).toEqual({
      totalCheckedIn: 15,
      totalCompleted: 9,
      totalNotCompleted: 6,
    });
  });
});

describe("dashboard queue and feedback sections", () => {
  it("builds booking queue section from totals and queue aggregate", () => {
    expect(
      buildBookingQueueSection(20, {
        totalCheckedIn: 12,
        totalCompleted: 9,
        totalNotCompleted: 3,
      }),
    ).toEqual({
      totalBookings: 20,
      checkedIn: 12,
      completed: 9,
      notCompleted: 3,
    });
  });

  it("builds feedback section from daily stats", () => {
    const aggregated: DailyRequestStats = {
      date: "",
      officeId: "",
      totalRequests: 4,
      bookings: 2,
      complaints: 1,
      proposals: 1,
      new: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      bookingNew: 0,
      bookingInProgress: 0,
      bookingCompleted: 0,
      bookingCancelled: 0,
      complaintNew: 2,
      complaintInProgress: 0,
      complaintCompleted: 0,
      complaintCancelled: 0,
      proposalNew: 1,
      proposalInProgress: 0,
      proposalCompleted: 0,
      proposalCancelled: 0,
    };
    expect(buildFeedbackSectionFromDailyStats(aggregated)).toEqual({
      total: 2,
      newCount: 3,
    });
  });

  it("builds feedback section from requests", () => {
    expect(
      buildFeedbackSectionFromRequests([
        request("1", "office-a", "new", "complaint"),
        request("2", "office-a", "completed", "proposal"),
        request("3", "office-a", "new", "booking"),
      ]),
    ).toEqual({ total: 2, newCount: 1 });
  });
});
