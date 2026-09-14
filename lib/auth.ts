const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

export type AuthFieldErrors = {
  email?: string;
  password?: string;
  name?: string;
  code?: string;
};

type ClerkFieldError = {
  message?: string | null;
} | null | undefined;

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function validateEmail(value: string) {
  const email = value.trim();
  if (!email) return "Email is required.";
  if (!isValidEmail(email)) return "Enter a valid email address.";
  return undefined;
}

export function validatePassword(value: string, { isSignUp = false } = {}) {
  if (!value) return "Password is required.";
  if (isSignUp && value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return undefined;
}

export function validateName(value: string) {
  if (!value.trim()) return "Name is required.";
  return undefined;
}

export function validateCode(value: string) {
  const code = value.trim();
  if (!code) return "Verification code is required.";
  if (!/^\d{6}$/.test(code)) return "Enter the 6-digit code from your email.";
  return undefined;
}

export function getClerkFieldError(
  errors: { fields?: object | null } | null | undefined,
  ...keys: string[]
): string | undefined {
  const fields = errors?.fields as Record<string, ClerkFieldError> | null | undefined;
  if (!fields) return undefined;

  for (const key of keys) {
    const message = fields[key]?.message?.trim();
    if (message) return message;
  }

  return undefined;
}

export function getClerkFormError(
  errors: { global?: Array<{ message?: string | null } | null> | null } | null | undefined,
): string | undefined {
  const globalErrors = errors?.global;
  if (!globalErrors?.length) return undefined;
  return globalErrors[0]?.message?.trim() || undefined;
}

export function getDisplayName(user: {
  firstName?: string | null;
  fullName?: string | null;
  username?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
} | null | undefined) {
  if (!user) return "there";
  return (
    user.firstName?.trim() ||
    user.fullName?.trim() ||
    user.username?.trim() ||
    user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "there"
  );
}
