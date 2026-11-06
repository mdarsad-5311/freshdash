import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Resolve base API URL from environment variable or production fallback
const resolveBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim();
  }
  // Production fallback: strictly use live PythonAnywhere backend, never localhost
  if (import.meta.env.PROD) {
    return 'https://mdarsad5311.pythonanywhere.com/api/v1';
  }
  return 'http://127.0.0.1:8000/api/v1';
};

const BASE_URL = resolveBaseUrl();

export const ADMIN_API_BASE = `${BASE_URL.replace(/\/+$/, '')}/admin`;

export const api = axios.create({
  baseURL: ADMIN_API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const TOKEN_STORAGE_KEY = 'freshdash_admin_access_token';
export const REFRESH_STORAGE_KEY = 'freshdash_admin_refresh_token';
export const USER_STORAGE_KEY = 'freshdash_admin_user';

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: handle 401 & token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const url = originalRequest.url || '';

    // If unauthorized and not already retrying, and not login endpoint
    if (status === 401 && !originalRequest._retry && !url.includes('/auth/login/')) {
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
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(REFRESH_STORAGE_KEY);
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(REFRESH_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(
          `${ADMIN_API_BASE}/auth/token/refresh/`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAccess =
          refreshResponse.data?.tokens?.access ||
          refreshResponse.data?.access;
        const newRefresh =
          refreshResponse.data?.tokens?.refresh ||
          refreshResponse.data?.refresh;

        if (!newAccess) {
          throw new Error('No access token in refresh response');
        }

        localStorage.setItem(TOKEN_STORAGE_KEY, newAccess);
        if (newRefresh) {
          localStorage.setItem(REFRESH_STORAGE_KEY, newRefresh);
        }

        if (typeof originalRequest.headers.set === 'function') {
          originalRequest.headers.set('Authorization', `Bearer ${newAccess}`);
        } else {
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
        }

        processQueue(null, newAccess);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(REFRESH_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Normalizes DRF errors into a readable string message.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      if ('message' in data && typeof data.message === 'string') return data.message;
      if ('detail' in data && typeof data.detail === 'string') return data.detail;
      if ('error' in data && typeof data.error === 'string') return data.error;

      // Check field errors
      const keys = Object.keys(data);
      if (keys.length > 0) {
        const firstVal = (data as Record<string, unknown>)[keys[0]];
        if (Array.isArray(firstVal) && firstVal.length > 0) {
          return `${keys[0]}: ${firstVal[0]}`;
        }
        if (typeof firstVal === 'string') {
          return `${keys[0]}: ${firstVal}`;
        }
      }
    }
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      return 'Cannot reach backend server. Please verify the Django API is running.';
    }
    return error.message || 'An unexpected error occurred.';
  }
  if (error instanceof Error) return error.message;
  return String(error) || 'An unexpected error occurred.';
}

