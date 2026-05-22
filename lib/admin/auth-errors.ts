import type { AdminAuthMessages } from "@/lib/i18n/messages";

const INVALID_CREDENTIAL_CODES = new Set([
  "auth/invalid-credential",
  "auth/wrong-password",
  "auth/user-not-found",
  "auth/invalid-email",
]);

export function mapFirebaseAuthError(
  code: string | undefined,
  errors: AdminAuthMessages["errors"],
): string {
  if (!code) return errors.generic;
  if (INVALID_CREDENTIAL_CODES.has(code)) return errors.invalidCredentials;
  if (code === "auth/too-many-requests") return errors.tooManyRequests;
  return errors.generic;
}

export function mapAdminSessionError(
  code: string | undefined,
  errors: AdminAuthMessages["errors"],
): string {
  switch (code) {
    case "forbidden_no_profile":
      return errors.noProfile;
    case "rate_limited":
      return errors.rateLimited;
    case "datastore_permission":
    case "datastore_unavailable":
      return errors.datastoreUnavailable;
    case "server_misconfigured":
      return errors.serverMisconfigured;
    case "auth_failed":
      return errors.generic;
    default:
      return errors.generic;
  }
}
