/**
 * Authentication validation rules for FreshDash.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  const trimmed = email.trim();
  return EMAIL_REGEX.test(trimmed);
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  return { valid: true };
}

export function validateLoginPayload(usernameOrEmail: string, password: string): string | null {
  if (!usernameOrEmail.trim() || !password) {
    return 'Please enter both your email/username and password.';
  }
  return null;
}

export interface SignupValidationFields {
  username?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
}

export function validateSignupPayload(fields: SignupValidationFields): string | null {
  const { username = '', email = '', password = '', passwordConfirm = '' } = fields;
  if (!username.trim() || !email.trim() || !password || !passwordConfirm) {
    return 'Please fill in all required fields.';
  }
  if (!validateEmail(email)) {
    return 'Please enter a valid email address.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (password !== passwordConfirm) {
    return 'Passwords do not match.';
  }
  return null;
}
