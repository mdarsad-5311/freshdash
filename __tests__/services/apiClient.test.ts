import axios from 'axios';
import { api, registerSessionExpiredListener } from '../../services/api';
import { secureStorage } from '../../services/secureStorage';
import { API_ENDPOINTS } from '../../constants/config';

describe('Central Axios API Client', () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(async () => {
    await secureStorage.clearAllAuthData();
    jest.clearAllMocks();
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
  });

  describe('Request Interceptor - JWT attachment', () => {
    it('attaches Bearer token to request header when access token is present', async () => {
      await secureStorage.setAccessToken('valid_jwt_token');

      let interceptedHeaders: any = null;
      api.defaults.adapter = async (config) => {
        interceptedHeaders = config.headers;
        return {
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      };

      await api.get('/test-endpoint/');

      expect(interceptedHeaders).toBeDefined();
      expect(interceptedHeaders['Authorization'] || interceptedHeaders.Authorization).toBe(
        'Bearer valid_jwt_token'
      );
    });

    it('does not attach Authorization header when no access token exists', async () => {
      let interceptedHeaders: any = null;
      api.defaults.adapter = async (config) => {
        interceptedHeaders = config.headers;
        return {
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      };

      await api.get('/public-endpoint/');

      expect(interceptedHeaders['Authorization']).toBeUndefined();
    });
  });

  describe('Response Interceptor - 401 Refresh & Retry', () => {
    it('attempts token refresh on 401, stores new tokens, and replays request', async () => {
      await secureStorage.setTokens('expired_token', 'valid_refresh_token');

      let requestCount = 0;
      api.defaults.adapter = async (config) => {
        requestCount++;
        if (requestCount === 1) {
          const error: any = new Error('Unauthorized');
          error.isAxiosError = true;
          error.config = config;
          error.response = {
            status: 401,
            data: { detail: 'Token is invalid or expired' },
            headers: {},
            config,
          };
          throw error;
        }

        // Second attempt after refresh
        return {
          data: { success: true, retried: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      };

      // Mock the isolated axios.post for refreshing token
      const axiosPostSpy = jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          tokens: {
            access: 'new_fresh_access_token',
            refresh: 'new_fresh_refresh_token',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const response = await api.get('/protected-resource/');

      expect(response.data).toEqual({ success: true, retried: true });
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      expect(await secureStorage.getAccessToken()).toBe('new_fresh_access_token');
      expect(await secureStorage.getRefreshToken()).toBe('new_fresh_refresh_token');

      axiosPostSpy.mockRestore();
    });

    it('wipes auth data and notifies session expired if refresh token fails', async () => {
      await secureStorage.setTokens('expired_token', 'invalid_refresh_token');

      const sessionExpiredSpy = jest.fn();
      const unsubscribe = registerSessionExpiredListener(sessionExpiredSpy);

      api.defaults.adapter = async (config) => {
        const error: any = new Error('Unauthorized');
        error.isAxiosError = true;
        error.config = config;
        error.response = {
          status: 401,
          data: { detail: 'Token is invalid or expired' },
          headers: {},
          config,
        };
        throw error;
      };

      const axiosPostSpy = jest.spyOn(axios, 'post').mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 401,
          data: { detail: 'Refresh token is expired' },
        },
      });

      await expect(api.get('/profile/')).rejects.toBeDefined();

      expect(sessionExpiredSpy).toHaveBeenCalledTimes(1);
      expect(await secureStorage.getAccessToken()).toBeNull();
      expect(await secureStorage.getRefreshToken()).toBeNull();

      unsubscribe();
      axiosPostSpy.mockRestore();
    });

    it('does not attempt refresh loop on authentication endpoints (e.g. login)', async () => {
      api.defaults.adapter = async (config) => {
        const error: any = new Error('Unauthorized');
        error.isAxiosError = true;
        error.config = config;
        error.response = {
          status: 401,
          data: { detail: 'Invalid credentials' },
          headers: {},
          config,
        };
        throw error;
      };

      const axiosPostSpy = jest.spyOn(axios, 'post');

      await expect(api.post(API_ENDPOINTS.AUTH.LOGIN, { username: 'u', password: 'p' })).rejects.toBeDefined();

      // Refresh endpoint should NEVER be called for login 401
      expect(axiosPostSpy).not.toHaveBeenCalled();

      axiosPostSpy.mockRestore();
    });
  });
});

