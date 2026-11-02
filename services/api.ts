import axios, {
  isAxiosError,
  create,
  type AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/config';
import { secureStorage } from './secureStorage';
import { RefreshResponse } from '../types/auth';
import { BackendErrorResponse, NormalizedApiError } from '../types/api';

/**
 * Normalizes any error (AxiosError, Network, Timeout, Server, Validation)
 * into a predictable, user-friendly structure.
 */
export function normalizeApiError(error: unknown): NormalizedApiError {
  if (isAxiosError(error)) {
    const status = error.response?.status || 0;
    const responseData = error.response?.data as BackendErrorResponse | undefined;

    let message = 'An unexpected error occurred.';
    let errors: Record<string, string[] | string> | undefined = undefined;

    if (responseData && typeof responseData === 'object') {
      if (typeof responseData.message === 'string' && responseData.message.trim()) {
        message = responseData.message;
      } else if (typeof responseData.detail === 'string' && responseData.detail.trim()) {
        message = responseData.detail;
      }

      if (responseData.errors && typeof responseData.errors === 'object') {
        errors = responseData.errors;
        // If message is generic, extract the first specific field error
        if (
          message === 'An unexpected error occurred.' ||
          message === 'Invalid input.' ||
          message === 'Validation error'
        ) {
          const firstKey = Object.keys(responseData.errors)[0];
          if (firstKey) {
            const val = responseData.errors[firstKey];
            const msg = Array.isArray(val) ? val[0] : val;
            message = `${firstKey}: ${msg}`;
          }
        }
      }
    } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      message = 'Cannot reach backend server. Please verify your connection.';
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timed out. Please check your internet connection.';
    }

    return {
      statusCode: status,
      message,
      errors,
      isNetworkError:
        status === 0 || error.message === 'Network Error' || error.code === 'ERR_NETWORK',
      isAuthError: status === 401 || status === 403,
      isServerError: status >= 500,
      originalError: error,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 0,
      message: error.message,
      isNetworkError: false,
      isAuthError: false,
      isServerError: false,
      originalError: error,
    };
  }

  return {
    statusCode: 0,
    message: String(error) || 'An unexpected error occurred.',
    isNetworkError: false,
    isAuthError: false,
    isServerError: false,
    originalError: error,
  };
}

// Concurrency mutex and queued request promises during token refresh
let isRefreshing = false;
interface FailedQueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}
let failedQueue: FailedQueueItem[] = [];

// Session expiry subscriber registry
type SessionExpiredCallback = () => void;
const sessionExpiredCallbacks = new Set<SessionExpiredCallback>();

export function registerSessionExpiredListener(callback: SessionExpiredCallback): () => void {
  sessionExpiredCallbacks.add(callback);
  return () => {
    sessionExpiredCallbacks.delete(callback);
  };
}

function notifySessionExpired(): void {
  sessionExpiredCallbacks.forEach((cb) => {
    try {
      cb();
    } catch {
      // Gracefully swallow listener errors
    }
  });
}

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Production-ready central Axios instance for FreshDash.
 */
export const api: AxiosInstance = create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request Interceptor:
 * Automatically injects the JWT access token from SecureStore into the Authorization header.
 * Avoids overwriting if custom authorization is already present.
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await secureStorage.getAccessToken();
    if (token) {
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } else {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Authorization');
      } else {
        delete config.headers['Authorization'];
      }
    }
    return config;
  },
  (error) => {
    const normalized = normalizeApiError(error);
    if (error && typeof error === 'object') {
      (error as any).normalized = normalized;
    }
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * - Passes through successful responses.
 * - Handles 401 Unauthorized via concurrency-safe refresh token mutex.
 * - Queues simultaneous failed requests while refresh is in-flight.
 * - Prevents infinite refresh loops on auth endpoints or retried requests.
 * - Automatically wipes local credentials and emits session-expired event on revoked/invalid refresh tokens.
 * - Normalizes all errors without leaking token values in logs.
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!error.response || !originalRequest) {
      const normalized = normalizeApiError(error);
      if (error && typeof error === 'object') {
        (error as any).normalized = normalized;
      }
      return Promise.reject(error);
    }

    const status = error.response.status;
    const url = originalRequest.url || '';

    // Bypass token refresh logic for authentication endpoints to prevent infinite loops
    const isAuthRequest =
      url.includes(API_ENDPOINTS.AUTH.LOGIN) ||
      url.includes(API_ENDPOINTS.AUTH.SIGNUP) ||
      url.includes(API_ENDPOINTS.AUTH.REFRESH);

    // If not a 401, or is an auth endpoint, or already retried once, reject immediately
    if (status !== 401 || isAuthRequest || originalRequest._retry) {
      const normalized = normalizeApiError(error);
      (error as any).normalized = normalized;
      return Promise.reject(error);
    }

    // If another request is actively refreshing the token, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${token}`);
          } else {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return api(originalRequest);
        })
        .catch((queuedErr) => {
          const normalized = normalizeApiError(queuedErr);
          if (queuedErr && typeof queuedErr === 'object') {
            (queuedErr as any).normalized = normalized;
          }
          return Promise.reject(queuedErr);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Use an isolated Axios call to avoid triggering response interceptors
      const refreshResponse = await axios.post<RefreshResponse & { access?: string; refresh?: string }>(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
        { refresh: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 10000,
        }
      );

      const responseData = refreshResponse.data;
      const newAccessToken = responseData?.tokens?.access || responseData?.access;
      const newRefreshToken = responseData?.tokens?.refresh || responseData?.refresh;

      if (!newAccessToken) {
        throw new Error('Refresh response missing access token');
      }

      // Save updated tokens securely
      if (newRefreshToken) {
        await secureStorage.setTokens(newAccessToken, newRefreshToken);
      } else {
        await secureStorage.setAccessToken(newAccessToken);
      }

      // Update original request authorization header
      if (typeof originalRequest.headers.set === 'function') {
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
      } else {
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
      }

      // Resolve all queued requests with the fresh access token
      processQueue(null, newAccessToken);

      // Replay the original failed request
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh token is expired, invalid, or blacklisted -> wipe session
      processQueue(refreshError, null);
      await secureStorage.clearAllAuthData();
      notifySessionExpired();

      const normalized = normalizeApiError(refreshError);
      if (refreshError && typeof refreshError === 'object') {
        (refreshError as any).normalized = normalized;
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * Convenient typed API helpers for application services.
 */
export const apiClient = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.get<T>(url, config);
  },

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.post<T>(url, data, config);
  },

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.put<T>(url, data, config);
  },

  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.patch<T>(url, data, config);
  },

  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.delete<T>(url, config);
  },

  normalizeError: normalizeApiError,
};
