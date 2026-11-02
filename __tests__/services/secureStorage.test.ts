import { secureStorage } from '../../services/secureStorage';
import * as SecureStore from 'expo-secure-store';

describe('secureStorage service', () => {
  beforeEach(async () => {
    await secureStorage.clearAllAuthData();
    jest.clearAllMocks();
  });

  describe('Tokens management', () => {
    it('sets and retrieves access token', async () => {
      await secureStorage.setAccessToken('access_token_123');
      const token = await secureStorage.getAccessToken();
      expect(token).toBe('access_token_123');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'freshdash_access_token',
        'access_token_123',
        expect.any(Object)
      );
    });

    it('sets and retrieves refresh token', async () => {
      await secureStorage.setRefreshToken('refresh_token_456');
      const token = await secureStorage.getRefreshToken();
      expect(token).toBe('refresh_token_456');
    });

    it('sets both access and refresh tokens simultaneously', async () => {
      await secureStorage.setTokens('acc_1', 'ref_1');
      expect(await secureStorage.getAccessToken()).toBe('acc_1');
      expect(await secureStorage.getRefreshToken()).toBe('ref_1');
    });

    it('clears tokens successfully', async () => {
      await secureStorage.setTokens('acc_1', 'ref_1');
      await secureStorage.clearTokens();
      expect(await secureStorage.getAccessToken()).toBeNull();
      expect(await secureStorage.getRefreshToken()).toBeNull();
    });
  });

  describe('User data management', () => {
    const mockUser = {
      id: 101,
      username: 'freshuser',
      email: 'user@freshdash.com',
      first_name: 'Fresh',
      last_name: 'User',
      phone_number: '9876543210',
      date_joined: '2026-01-01',
    };

    it('saves and retrieves structured user data', async () => {
      await secureStorage.setUserData(mockUser);
      const user = await secureStorage.getUserData();
      expect(user).toEqual(mockUser);
    });

    it('returns null if no user data is stored', async () => {
      const user = await secureStorage.getUserData();
      expect(user).toBeNull();
    });

    it('clears user data independently', async () => {
      await secureStorage.setUserData(mockUser);
      await secureStorage.clearUserData();
      const user = await secureStorage.getUserData();
      expect(user).toBeNull();
    });

    it('handles malformed JSON in user data gracefully without crashing', async () => {
      await SecureStore.setItemAsync('freshdash_user_data', 'not-valid-json');
      const user = await secureStorage.getUserData();
      expect(user).toBeNull();
    });
  });

  describe('clearAllAuthData', () => {
    it('wipes tokens and user data completely', async () => {
      await secureStorage.setTokens('acc_xyz', 'ref_xyz');
      await secureStorage.setUserData({
        id: 1,
        username: 'alice',
        email: 'alice@freshdash.com',
      });

      await secureStorage.clearAllAuthData();

      expect(await secureStorage.getAccessToken()).toBeNull();
      expect(await secureStorage.getRefreshToken()).toBeNull();
      expect(await secureStorage.getUserData()).toBeNull();
    });
  });
});

