import { bearerToken, safeTokenEquals } from "@/lib/security/bearer-token";
import { noStoreJson } from "@/lib/security/admin-request";

/** Validates Bearer token against the endpoint secret (or shared CRON_SECRET on Vercel). */
export function authorizeCronRequest(
  request: Request,
  envVarName: string,
): Response | null {
  const expected =
    process.env[envVarName]?.trim() || process.env.CRON_SECRET?.trim();
  if (!expected) {
    return noStoreJson(
      { error: `${envVarName} غير مضبوط.` },
      { status: 500 },
    );
  }
  if (!safeTokenEquals(bearerToken(request), expected)) {
    return noStoreJson({ error: "غير مصرح." }, { status: 401 });
  }
  return null;
}
