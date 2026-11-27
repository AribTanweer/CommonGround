export const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,30}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PasswordStrength {
  score: number; // 0 to 4
  label: string;
  barColor: string;
  checks: {
    minLength: boolean;
    hasLetter: boolean;
    hasNumber: boolean;
    hasSymbolOrUpper: boolean;
  };
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbolOrUpper: /[A-Z]/.test(password) || /[^a-zA-Z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  const config =
    score <= 1
      ? { label: 'Weak', barColor: 'bg-destructive' }
      : score === 2
      ? { label: 'Fair', barColor: 'bg-amber-500' }
      : score === 3
      ? { label: 'Good', barColor: 'bg-blue-500' }
      : { label: 'Strong', barColor: 'bg-emerald-500' };

  return { score, ...config, checks };
}

export function extractApiError(err: any, fallback: string): {
  summary: string;
  fields: Record<string, string>;
} {
  const data = err?.response?.data;
  if (!data || typeof data !== 'object') {
    return { summary: fallback, fields: {} };
  }

  const fields: Record<string, string> = {};
  for (const [key, val] of Object.entries(data)) {
    if (key === 'detail' || key === 'non_field_errors') continue;
    if (Array.isArray(val) && val.length > 0) {
      fields[key] = String(val[0]);
    } else if (typeof val === 'string') {
      fields[key] = val;
    }
  }

  const summary =
    (typeof data.detail === 'string' && data.detail) ||
    (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) ||
    Object.values(fields)[0] ||
    fallback;

  return { summary, fields };
}
