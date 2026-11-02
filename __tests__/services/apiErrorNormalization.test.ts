import { AxiosError } from 'axios';
import { normalizeApiError } from '../../services/api';

describe('normalizeApiError utility', () => {
  it('normalizes network errors with user-friendly message and flags', () => {
    const networkError = new AxiosError(
      'Network Error',
      'ERR_NETWORK',
      undefined,
      undefined,
      undefined
    );

    const result = normalizeApiError(networkError);

    expect(result.isNetworkError).toBe(true);
    expect(result.statusCode).toBe(0);
    expect(result.message).toBe('Cannot reach backend server. Please verify your connection.');
  });

  it('normalizes connection timeout error (ECONNABORTED)', () => {
    const timeoutError = new AxiosError(
      'timeout of 15000ms exceeded',
      'ECONNABORTED',
      undefined,
      undefined,
      undefined
    );

    const result = normalizeApiError(timeoutError);

    expect(result.message).toBe('Request timed out. Please check your internet connection.');
    expect(result.isNetworkError).toBe(true);
  });

  it('normalizes 401 and 403 authentication errors', () => {
    const authError401 = new AxiosError(
      'Unauthorized',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
        data: { detail: 'Given token not valid for any token type' },
      }
    );

    const result401 = normalizeApiError(authError401);
    expect(result401.statusCode).toBe(401);
    expect(result401.isAuthError).toBe(true);
    expect(result401.message).toBe('Given token not valid for any token type');

    const authError403 = new AxiosError(
      'Forbidden',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config: {} as any,
        data: { detail: 'You do not have permission to perform this action.' },
      }
    );

    const result403 = normalizeApiError(authError403);
    expect(result403.statusCode).toBe(403);
    expect(result403.isAuthError).toBe(true);
  });

  it('normalizes 500 server errors', () => {
    const serverError = new AxiosError(
      'Internal Server Error',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
        data: { message: 'Server crashed processing request.' },
      }
    );

    const result = normalizeApiError(serverError);
    expect(result.statusCode).toBe(500);
    expect(result.isServerError).toBe(true);
    expect(result.message).toBe('Server crashed processing request.');
  });

  it('extracts field validation error when message is generic', () => {
    const validationError = new AxiosError(
      'Bad Request',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
        data: {
          message: 'Validation error',
          errors: {
            username: ['A user with that username already exists.'],
            email: ['Enter a valid email address.'],
          },
        },
      }
    );

    const result = normalizeApiError(validationError);
    expect(result.statusCode).toBe(400);
    expect(result.message).toBe('username: A user with that username already exists.');
    expect(result.errors).toEqual({
      username: ['A user with that username already exists.'],
      email: ['Enter a valid email address.'],
    });
  });

  it('normalizes generic JavaScript Error instances', () => {
    const jsError = new Error('Custom local runtime error');
    const result = normalizeApiError(jsError);

    expect(result.statusCode).toBe(0);
    expect(result.message).toBe('Custom local runtime error');
    expect(result.isNetworkError).toBe(false);
    expect(result.isAuthError).toBe(false);
    expect(result.isServerError).toBe(false);
  });

  it('normalizes primitive string errors or unknown objects', () => {
    const stringError = 'Something failed';
    const result = normalizeApiError(stringError);

    expect(result.statusCode).toBe(0);
    expect(result.message).toBe('Something failed');
  });
});

