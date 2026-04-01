export type AuthFieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  phoneNumber?: string;
  code?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_E164_REGEX = /^\+\d{7,15}$/;
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/;
const CONFIRM_CODE_REGEX = /^\d{4,8}$/;

export function normalizePhoneForCognito(input: string): string | null {
  const compact = input.replace(/[\s\-()]/g, "");
  const normalized = compact.startsWith("+") ? compact : `+${compact}`;
  if (!PHONE_E164_REGEX.test(normalized)) return null;
  return normalized;
}

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(value.trim())) return "Enter a valid email address.";
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "Password is required.";
  if (!PASSWORD_POLICY_REGEX.test(value)) {
    return "Password must be at least 12 chars with uppercase, lowercase, number, and symbol.";
  }
  return undefined;
}

export function validateConfirmPassword(password: string, confirmPassword: string): string | undefined {
  if (!confirmPassword) return "Confirm password is required.";
  if (password !== confirmPassword) return "Password and confirm password must match.";
  return undefined;
}

export function validatePhoneNumber(value: string): string | undefined {
  if (!value.trim()) return "Phone number is required.";
  if (!normalizePhoneForCognito(value)) return "Enter a valid phone number (example: +14155552671).";
  return undefined;
}

export function validateConfirmationCode(value: string): string | undefined {
  if (!value.trim()) return "Confirmation code is required.";
  if (!CONFIRM_CODE_REGEX.test(value.trim())) return "Enter a valid confirmation code.";
  return undefined;
}
