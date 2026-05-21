/**
 * Central helpers for environment and production safety checks.
 */

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getPublicSiteUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "").trim() || undefined;
}

export function isFirebaseClientConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  );
}

export type CronEndpoint =
  | "maintenance-retention"
  | "queue-close"
  | "queue-notify-scan";

const CRON_ENV: Record<CronEndpoint, string> = {
  "maintenance-retention": "MAINTENANCE_CRON_SECRET",
  "queue-close": "DAILY_QUEUE_CRON_SECRET",
  "queue-notify-scan": "QUEUE_NOTIFY_CRON_SECRET",
};

export function getCronSecret(endpoint: CronEndpoint): string | undefined {
  const key = CRON_ENV[endpoint];
  return process.env[key]?.trim() || undefined;
}

export function missingProductionEnvKeys(): string[] {
  const required = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "MAINTENANCE_CRON_SECRET",
    "DAILY_QUEUE_CRON_SECRET",
    "QUEUE_NOTIFY_CRON_SECRET",
  ];
  return required.filter((key) => !process.env[key]?.trim());
}
