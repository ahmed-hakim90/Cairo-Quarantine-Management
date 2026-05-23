import { getCairoTodayYmd, getCairoYmdDaysAgo } from "@/lib/cairo-today-ymd";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  aggregateDailyRequestStats,
  listDailyRequestStatsForOffices,
} from "@/lib/office-requests/daily-request-stats";
import { listOffices } from "@/lib/office-requests/store";

export type PublicTravelerStats = {
  totalRequestsLast30Days: number;
  completedBookingsLast30Days: number;
  activeOffices: number;
};

export type PublicLandingStats = {
  activeOffices: number;
  dailyRequests: number;
};

/** Today's request total across all offices (Cairo calendar day). */
export async function getPublicDailyRequestTotal(): Promise<number> {
  const offices = await listOffices();
  if (!isFirebaseAdminConfigured() || offices.length === 0) return 0;

  const today = getCairoTodayYmd();
  const rows = await listDailyRequestStatsForOffices({
    officeIds: offices.map((o) => o.id),
    fromDate: today,
    toDate: today,
  });
  return aggregateDailyRequestStats(rows).totalRequests;
}

export async function getPublicLandingStats(): Promise<PublicLandingStats> {
  const [offices, dailyRequests] = await Promise.all([
    listOffices(),
    getPublicDailyRequestTotal(),
  ]);
  return {
    activeOffices: offices.filter((o) => o.active).length,
    dailyRequests,
  };
}

export async function getPublicTravelerStats(): Promise<PublicTravelerStats> {
  const offices = await listOffices();
  const activeOffices = offices.filter((o) => o.active).length;

  if (!isFirebaseAdminConfigured() || offices.length === 0) {
    return {
      totalRequestsLast30Days: 0,
      completedBookingsLast30Days: 0,
      activeOffices,
    };
  }

  const toDate = getCairoTodayYmd();
  const fromDate = getCairoYmdDaysAgo(30);
  const rows = await listDailyRequestStatsForOffices({
    officeIds: offices.map((o) => o.id),
    fromDate,
    toDate,
  });
  const aggregated = aggregateDailyRequestStats(rows);

  return {
    totalRequestsLast30Days: aggregated.totalRequests,
    completedBookingsLast30Days: aggregated.completed,
    activeOffices,
  };
}
