import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthUser } from '../types/auth';

const ACCESS_TOKEN_KEY = 'freshdash_access_token';
const REFRESH_TOKEN_KEY = 'freshdash_refresh_token';
const USER_DATA_KEY = 'freshdash_user_data';

// In-memory fallback for environments where SecureStore is unavailable (e.g., standard web preview)
const memoryStore = new Map<string, string>();

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  const available = await isSecureStoreAvailable();
  if (available) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  } else if (Platform.OS === 'web' && typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.setItem(key, value);
  } else {
    memoryStore.set(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  const available = await isSecureStoreAvailable();
  if (available) {
    return await SecureStore.getItemAsync(key);
  } else if (Platform.OS === 'web' && typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage.getItem(key);
  } else {
    return memoryStore.get(key) || null;
  }
}

async function deleteItem(key: string): Promise<void> {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      await SecureStore.deleteItemAsync(key);
    } else if (Platform.OS === 'web' && typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(key);
    } else {
      memoryStore.delete(key);
    }
  } catch {
    // Ensure memory store key is deleted even if SecureStore encounters an error
    memoryStore.delete(key);
  }
}

export const secureStorage = {
  async getAccessToken(): Promise<string | null> {
    return await getItem(ACCESS_TOKEN_KEY);
  },

  async setAccessToken(token: string): Promise<void> {
    await setItem(ACCESS_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await getItem(REFRESH_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await setItem(REFRESH_TOKEN_KEY, token);
  },

  async setTokens(access: string, refresh: string): Promise<void> {
    await Promise.all([
      setItem(ACCESS_TOKEN_KEY, access),
      setItem(REFRESH_TOKEN_KEY, refresh),
    ]);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      deleteItem(ACCESS_TOKEN_KEY),
      deleteItem(REFRESH_TOKEN_KEY),
    ]);
  },

  async getUserData(): Promise<AuthUser | null> {
    const raw = await getItem(USER_DATA_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  async setUserData(user: AuthUser): Promise<void> {
    await setItem(USER_DATA_KEY, JSON.stringify(user));
  },

  async clearUserData(): Promise<void> {
    await deleteItem(USER_DATA_KEY);
  },

  async clearAllAuthData(): Promise<void> {
    await Promise.all([
      deleteItem(ACCESS_TOKEN_KEY),
      deleteItem(REFRESH_TOKEN_KEY),
      deleteItem(USER_DATA_KEY),
    ]);
  },
};

