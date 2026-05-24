import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import type {
  DailyPublicStats,
  PublicAnalyticsAction,
  PublicDeviceClass,
  PublicFormType,
} from "@/lib/analytics/public-analytics-types";

export const PUBLIC_ANALYTICS_ACTIONS: PublicAnalyticsAction[] = [
  "page.view",
  "session.start",
  "session.heartbeat",
  "form.start",
  "form.step",
  "form.submit_attempt",
  "form.submit_success",
  "form.submit_error",
  "form.abandon",
  "api.error",
  "checkin.search_start",
  "checkin.ticket_created",
];

const SESSION_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_PATH_LENGTH = 512;
const MAX_META_KEYS = 20;
const MAX_META_VALUE_LENGTH = 256;

export type PublicAnalyticsIngestInput = {
  sessionId: string;
  action: PublicAnalyticsAction;
  path: string;
  locale: Locale;
  meta?: Record<string, unknown>;
  deviceClass?: PublicDeviceClass;
};

export function isPublicAnalyticsAction(
  value: unknown,
): value is PublicAnalyticsAction {
  return (
    typeof value === "string" &&
    (PUBLIC_ANALYTICS_ACTIONS as string[]).includes(value)
  );
}

export function isPublicDeviceClass(
  value: unknown,
): value is PublicDeviceClass {
  return value === "mobile" || value === "desktop";
}

export function isPublicFormType(value: unknown): value is PublicFormType {
  return value === "booking" || value === "complaint" || value === "checkin";
}

export function sanitizePublicMeta(
  meta: unknown,
): Record<string, unknown> | undefined {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (Object.keys(out).length >= MAX_META_KEYS) break;
    if (typeof key !== "string" || key.length === 0 || key.length > 64) continue;
    if (
      typeof value === "string" &&
      value.length <= MAX_META_VALUE_LENGTH
    ) {
      out[key] = value;
    } else if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      out[key] = value;
    } else if (typeof value === "boolean") {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function parsePublicAnalyticsIngestBody(
  body: unknown,
): { ok: true; value: PublicAnalyticsIngestInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "invalid_body" };
  }
  const raw = body as Record<string, unknown>;
  const sessionId = typeof raw.sessionId === "string" ? raw.sessionId.trim() : "";
  if (!SESSION_ID_RE.test(sessionId)) {
    return { ok: false, error: "invalid_session_id" };
  }
  if (!isPublicAnalyticsAction(raw.action)) {
    return { ok: false, error: "invalid_action" };
  }
  const path =
    typeof raw.path === "string"
      ? raw.path.trim().slice(0, MAX_PATH_LENGTH)
      : "";
  if (!path.startsWith("/")) {
    return { ok: false, error: "invalid_path" };
  }
  const localeRaw = typeof raw.locale === "string" ? raw.locale.trim() : "";
  if (!isLocale(localeRaw)) {
    return { ok: false, error: "invalid_locale" };
  }
  const deviceClass = isPublicDeviceClass(raw.deviceClass)
    ? raw.deviceClass
    : undefined;
  return {
    ok: true,
    value: {
      sessionId,
      action: raw.action,
      path,
      locale: localeRaw,
      meta: sanitizePublicMeta(raw.meta),
      deviceClass,
    },
  };
}

export function deviceClassFromUserAgent(userAgent: string | null): PublicDeviceClass {
  const ua = (userAgent ?? "").toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|webos|blackberry/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

export function maskPhoneForAnalytics(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***${digits.slice(-4)}`;
}

/** Low-volume actions stored in public_events for admin problem feeds. */
export function shouldPersistPublicAnalyticsEvent(
  action: PublicAnalyticsAction,
): boolean {
  return (
    action === "form.submit_error" ||
    action === "form.abandon" ||
    action === "form.submit_success" ||
    action === "api.error"
  );
}

export function incrementDailyStatsForAction(
  action: PublicAnalyticsAction,
  path: string,
): Partial<DailyPublicStatsDelta> {
  switch (action) {
    case "page.view":
      return { pageViews: 1, pathIncrement: path };
    case "session.start":
      return { uniqueSessions: 1 };
    case "form.start":
      return { formStarts: 1 };
    case "form.submit_success":
      return { formSubmits: 1 };
    case "form.abandon":
      return { formAbandonments: 1 };
    case "form.submit_error":
      return { formErrors: 1 };
    case "api.error":
      return { apiErrors: 1 };
    default:
      return {};
  }
}

/** Deduped daily counters: one visitor per day, one page hit per path per day. */
export function computeDailyStatsDelta(
  input: PublicAnalyticsIngestInput,
  existing: FirebaseFirestore.DocumentData | undefined,
  todayYmd: string,
): {
  delta: Partial<DailyPublicStatsDelta>;
  sessionFields: Record<string, unknown>;
} {
  const sessionFields: Record<string, unknown> = {};
  const delta: Partial<DailyPublicStatsDelta> = {};
  const statsDate =
    typeof existing?.statsDate === "string" ? existing.statsDate : null;
  const isNewStatsDay = statsDate !== todayYmd;

  const pathsCountedToday =
    !isNewStatsDay &&
    existing?.pathsCountedToday &&
    typeof existing.pathsCountedToday === "object" &&
    !Array.isArray(existing.pathsCountedToday)
      ? { ...(existing.pathsCountedToday as Record<string, boolean>) }
      : {};

  const formsStartedToday =
    !isNewStatsDay &&
    existing?.formsStartedToday &&
    typeof existing.formsStartedToday === "object" &&
    !Array.isArray(existing.formsStartedToday)
      ? { ...(existing.formsStartedToday as Record<string, boolean>) }
      : {};

  if (isNewStatsDay) {
    delta.uniqueSessions = 1;
    sessionFields.statsDate = todayYmd;
    sessionFields.pathsCountedToday = {};
    sessionFields.formsStartedToday = {};
  }

  switch (input.action) {
    case "page.view":
      if (!pathsCountedToday[input.path]) {
        delta.pageViews = 1;
        delta.pathIncrement = input.path;
        pathsCountedToday[input.path] = true;
        sessionFields.pathsCountedToday = pathsCountedToday;
      }
      break;
    case "form.start": {
      const formType = input.meta?.formType;
      if (typeof formType === "string" && !formsStartedToday[formType]) {
        delta.formStarts = 1;
        formsStartedToday[formType] = true;
        sessionFields.formsStartedToday = formsStartedToday;
      }
      break;
    }
    case "form.submit_success":
      delta.formSubmits = 1;
      break;
    case "form.abandon":
      delta.formAbandonments = 1;
      break;
    case "form.submit_error":
      delta.formErrors = 1;
      break;
    case "api.error":
      delta.apiErrors = 1;
      break;
    default:
      break;
  }

  return { delta, sessionFields };
}

export type DailyPublicStatsDelta = {
  pageViews: number;
  uniqueSessions: number;
  totalSessionSeconds: number;
  formStarts: number;
  formSubmits: number;
  formAbandonments: number;
  formErrors: number;
  apiErrors: number;
  activeNowPeak: number;
  pathIncrement?: string;
};

export function aggregateDailyPublicStats(
  rows: Array<Partial<DailyPublicStats> & { date: string }>,
): DailyPublicStats {
  const merged: DailyPublicStats = {
    date: rows[0]?.date ?? "",
    pageViews: 0,
    uniqueSessions: 0,
    totalSessionSeconds: 0,
    avgSessionSeconds: 0,
    byPath: {},
    formStarts: 0,
    formSubmits: 0,
    formAbandonments: 0,
    formErrors: 0,
    apiErrors: 0,
    activeNowPeak: 0,
  };
  for (const row of rows) {
    merged.pageViews += row.pageViews ?? 0;
    merged.uniqueSessions += row.uniqueSessions ?? 0;
    merged.totalSessionSeconds += row.totalSessionSeconds ?? 0;
    merged.formStarts += row.formStarts ?? 0;
    merged.formSubmits += row.formSubmits ?? 0;
    merged.formAbandonments += row.formAbandonments ?? 0;
    merged.formErrors += row.formErrors ?? 0;
    merged.apiErrors += row.apiErrors ?? 0;
    merged.activeNowPeak = Math.max(
      merged.activeNowPeak,
      row.activeNowPeak ?? 0,
    );
    for (const [path, count] of Object.entries(row.byPath ?? {})) {
      merged.byPath[path] = (merged.byPath[path] ?? 0) + count;
    }
  }
  merged.avgSessionSeconds =
    merged.uniqueSessions > 0
      ? Math.round(merged.totalSessionSeconds / merged.uniqueSessions)
      : 0;
  return merged;
}

export function countActiveSessions(
  sessions: Array<{ lastSeenAt: string }>,
  nowMs: number,
  windowMs: number,
): number {
  const cutoff = nowMs - windowMs;
  return sessions.filter(
    (s) => Date.parse(s.lastSeenAt) >= cutoff,
  ).length;
}
