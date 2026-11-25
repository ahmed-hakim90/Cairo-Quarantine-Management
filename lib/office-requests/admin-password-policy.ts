/**
 * Admin console accounts guard citizen data, so passwords must resist guessing.
 * Firebase only enforces 6 characters; this is the app-level minimum.
 */
export const ADMIN_PASSWORD_MIN_LENGTH = 10;

export const ADMIN_PASSWORD_RULE_AR = `${ADMIN_PASSWORD_MIN_LENGTH} أحرف على الأقل وتحتوي على حروف وأرقام`;

/** Returns an Arabic error message, or null when the password is acceptable. */
export function adminPasswordProblem(password: string): string | null {
  if (password.length < ADMIN_PASSWORD_MIN_LENGTH) {
    return `كلمة المرور يجب ألا تقل عن ${ADMIN_PASSWORD_MIN_LENGTH} أحرف.`;
  }
  if (!/\p{L}/u.test(password) || !/\p{Nd}/u.test(password)) {
    return "كلمة المرور يجب أن تحتوي على حروف وأرقام معاً.";
  }
  if (new Set(password).size < 4) {
    return "كلمة المرور سهلة التخمين. اختر كلمة أكثر تنوعاً.";
  }
  return null;
}
