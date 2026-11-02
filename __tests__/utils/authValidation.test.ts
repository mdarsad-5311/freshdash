import {
  validateEmail,
  validatePassword,
  validateLoginPayload,
  validateSignupPayload,
} from '../../utils/authValidation';

describe('Authentication Validation Utility', () => {
  describe('validateEmail', () => {
    it('returns true for valid email formats', () => {
      expect(validateEmail('user@freshdash.com')).toBe(true);
      expect(validateEmail('customer.name@domain.co.in')).toBe(true);
    });

    it('returns false for invalid email formats', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('plainstring')).toBe(false);
      expect(validateEmail('missingdomain@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('passes passwords with 8 or more characters', () => {
      expect(validatePassword('secret123').valid).toBe(true);
      expect(validatePassword('12345678').valid).toBe(true);
    });

    it('fails passwords with less than 8 characters', () => {
      const result = validatePassword('short');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters long.');
    });
  });

  describe('validateLoginPayload', () => {
    it('returns null when both credentials are provided', () => {
      expect(validateLoginPayload('john', 'secret123')).toBeNull();
      expect(validateLoginPayload('john@freshdash.com', 'secret123')).toBeNull();
    });

    it('returns error message if either field is missing', () => {
      expect(validateLoginPayload('', 'pass')).toBe(
        'Please enter both your email/username and password.'
      );
      expect(validateLoginPayload('john', '')).toBe(
        'Please enter both your email/username and password.'
      );
      expect(validateLoginPayload('   ', 'pass')).toBe(
        'Please enter both your email/username and password.'
      );
    });
  });

  describe('validateSignupPayload', () => {
    const validPayload = {
      username: 'john_doe',
      email: 'john@freshdash.com',
      password: 'password123',
      passwordConfirm: 'password123',
    };

    it('returns null for valid signup fields', () => {
      expect(validateSignupPayload(validPayload)).toBeNull();
    });

    it('detects missing required fields', () => {
      expect(validateSignupPayload({ ...validPayload, username: '' })).toBe(
        'Please fill in all required fields.'
      );
      expect(validateSignupPayload({ ...validPayload, email: '' })).toBe(
        'Please fill in all required fields.'
      );
      expect(validateSignupPayload({ ...validPayload, password: '' })).toBe(
        'Please fill in all required fields.'
      );
      expect(validateSignupPayload({ ...validPayload, passwordConfirm: '' })).toBe(
        'Please fill in all required fields.'
      );
    });

    it('detects invalid email format', () => {
      expect(validateSignupPayload({ ...validPayload, email: 'invalidemail' })).toBe(
        'Please enter a valid email address.'
      );
    });

    it('detects short password length', () => {
      expect(
        validateSignupPayload({
          ...validPayload,
          password: '123',
          passwordConfirm: '123',
        })
      ).toBe('Password must be at least 8 characters long.');
    });

    it('detects password mismatch', () => {
      expect(
        validateSignupPayload({
          ...validPayload,
          password: 'password123',
          passwordConfirm: 'differentpassword',
        })
      ).toBe('Passwords do not match.');
    });
  });
});

