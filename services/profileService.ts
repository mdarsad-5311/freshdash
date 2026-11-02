import { api, normalizeApiError } from './api';
import { API_ENDPOINTS } from '../constants/config';
import { AuthUser, UpdateProfilePayload, UpdateProfileResponse } from '../types/auth';
import { secureStorage } from './secureStorage';

export const profileService = {
  /**
   * Fetch authenticated user's profile from the backend.
   */
  async getProfile(): Promise<AuthUser> {
    try {
      const response = await api.get<AuthUser | { user: AuthUser }>(
        API_ENDPOINTS.AUTH.ME
      );
      const data = response.data;
      const user =
        data && typeof data === 'object' && 'user' in data && data.user
          ? data.user
          : (data as AuthUser);

      if (user && user.id) {
        await secureStorage.setUserData(user);
      }
      return user;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Update authenticated user's profile details and preferences.
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
    try {
      const response = await api.patch<UpdateProfileResponse>(
        API_ENDPOINTS.AUTH.ME,
        payload
      );
      const updatedUser = response.data.user;
      if (updatedUser && updatedUser.id) {
        await secureStorage.setUserData(updatedUser);
      }
      return updatedUser;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};

