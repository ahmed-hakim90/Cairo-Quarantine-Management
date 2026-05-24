export type PublicAnalyticsAction =
  | "page.view"
  | "session.start"
  | "session.heartbeat"
  | "form.start"
  | "form.step"
  | "form.submit_attempt"
  | "form.submit_success"
  | "form.submit_error"
  | "form.abandon"
  | "api.error"
  | "checkin.search_start"
  | "checkin.ticket_created";

export type PublicDeviceClass = "mobile" | "desktop";

export type PublicFormType = "booking" | "complaint" | "checkin";

export type PublicSessionRecord = {
  sessionId: string;
  createdAt: string;
  lastSeenAt: string;
  endedAt?: string;
  locale: string;
  firstPath: string;
  lastPath: string;
  pageViewCount: number;
  durationSeconds: number;
  deviceClass: PublicDeviceClass;
  formActive?: boolean;
  formType?: PublicFormType;
  lastFormStep?: string;
  officeId?: string;
  maskedPhone?: string;
  preferredDate?: string;
};

export type PublicEventRecord = {
  id: string;
  sessionId: string;
  action: PublicAnalyticsAction;
  path: string;
  locale: string;
  createdAt: string;
  meta?: Record<string, unknown>;
};

export type DailyPublicStats = {
  date: string;
  pageViews: number;
  uniqueSessions: number;
  totalSessionSeconds: number;
  avgSessionSeconds: number;
  byPath: Record<string, number>;
  formStarts: number;
  formSubmits: number;
  formAbandonments: number;
  formErrors: number;
  apiErrors: number;
  activeNowPeak: number;
};

export type PublicProblemEvent = PublicEventRecord & {
  summaryAr: string;
};

export type PlatformInsightsSnapshot = {
  activeSessions: PublicSessionRecord[];
  activeCount: number;
  todayStats: DailyPublicStats;
  rangeStats: DailyPublicStats;
  topPaths: { path: string; count: number }[];
  problemEvents: PublicProblemEvent[];
  abandonedSessions: PublicSessionRecord[];
};
