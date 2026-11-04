import { api, TOKEN_STORAGE_KEY, REFRESH_STORAGE_KEY, USER_STORAGE_KEY } from './api';
import { AdminLoginResponse, AdminUser } from '../types/auth';

export const authService = {
  /**
   * Authenticate admin or manager.
   * Accepts username or email.
   */
  async login(usernameOrEmail: string, password: string): Promise<AdminLoginResponse> {
    const response = await api.post<AdminLoginResponse>('/auth/login/', {
      username: usernameOrEmail,
      password,
    });

    const { tokens, token, user } = response.data;
    const access = tokens?.access || token;
    const refresh = tokens?.refresh;

    if (access) {
      localStorage.setItem(TOKEN_STORAGE_KEY, access);
    }
    if (refresh) {
      localStorage.setItem(REFRESH_STORAGE_KEY, refresh);
    }
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }

    return response.data;
  },

  /**
   * Fetch current authenticated admin user profile.
   */
  async getProfile(): Promise<AdminUser> {
    const response = await api.get<{ success: boolean; user: AdminUser }>('/auth/me/');
    const user = response.data.user;
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  },

  /**
   * Update admin profile info.
   */
  async updateProfile(data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
  }): Promise<AdminUser> {
    const response = await api.patch<{ success: boolean; user: AdminUser }>('/auth/me/', data);
    const user = response.data.user;
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  },

  /**
   * Log out admin and blacklist the refresh token on backend.
   */
  async logout(): Promise<void> {
    try {
      const refresh = localStorage.getItem(REFRESH_STORAGE_KEY);
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } catch {
      // Even if backend fails, clear client storage
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  },

  /**
   * Check if token exists locally.
   */
  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
  },

  /**
   * Get cached user from localStorage.
   */
  getCachedUser(): AdminUser | null {
    const userStr = localStorage.getItem(USER_STORAGE_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
};

