import { api } from './api';
import { secureStorage } from './secureStorage';
import { API_ENDPOINTS } from '../constants/config';
import {
  AuthResponse,
  AuthUser,
  LoginPayload,
  SignupPayload,
} from '../types/auth';

export const authService = {
  /**
   * Log in user with username (or email) and password.
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      payload
    );

    const { tokens, token, user } = response.data;
    const access = tokens?.access || token;
    const refresh = tokens?.refresh;

    if (access && refresh) {
      await secureStorage.setTokens(access, refresh);
    } else if (access) {
      await secureStorage.setAccessToken(access);
    }

    if (user) {
      await secureStorage.setUserData(user);
    }

    return response.data;
  },

  /**
   * Register a new user account.
   */
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      API_ENDPOINTS.AUTH.SIGNUP,
      payload
    );

    const { tokens, token, user } = response.data;
    const access = tokens?.access || token;
    const refresh = tokens?.refresh;

    if (access && refresh) {
      await secureStorage.setTokens(access, refresh);
    } else if (access) {
      await secureStorage.setAccessToken(access);
    }

    if (user) {
      await secureStorage.setUserData(user);
    }

    return response.data;
  },

  /**
   * Log out current user, blacklist the refresh token on backend, and clear local storage.
   */
  async logout(): Promise<void> {
    try {
      const refresh = await secureStorage.getRefreshToken();
      if (refresh) {
        await api.post(API_ENDPOINTS.AUTH.LOGOUT, { refresh });
      }
    } catch {
      // Even if network or token invalidation fails on the backend, ensure client is logged out
    } finally {
      await secureStorage.clearAllAuthData();
    }
  },

  /**
   * Fetch current authenticated user's profile.
   */
  async getCurrentUser(): Promise<AuthUser> {
    const response = await api.get<{ success?: boolean; user?: AuthUser } & AuthUser>(
      API_ENDPOINTS.AUTH.ME
    );
    const user = response.data.user || (response.data as unknown as AuthUser);
    if (user && user.id) {
      await secureStorage.setUserData(user);
    }
    return user;
  },

  /**
   * Update current authenticated user's profile.
   */
  async updateProfile(payload: Partial<AuthUser> & { phone_number?: string; order_updates?: boolean; offers_notifications?: boolean }): Promise<AuthUser> {
    const response = await api.patch<{ success: boolean; message: string; user: AuthUser }>(
      API_ENDPOINTS.AUTH.ME,
      payload
    );
    const user = response.data.user;
    if (user && user.id) {
      await secureStorage.setUserData(user);
    }
    return user;
  },
};

