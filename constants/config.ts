import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolve the API base URL depending on the running environment.
 * - If EXPO_PUBLIC_API_URL is configured in .env, prioritize it.
 * - Auto-detect development machine host IP from Expo hostUri when running on physical device or simulator.
 * - Android Emulator fallback uses 10.0.2.2 to reach the host machine.
 * - iOS Simulator / Web / Desktop fallback uses 127.0.0.1 / localhost.
 */
const getDefaultApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // In production builds (!__DEV__), never use localhost or private emulator loopback IPs
  if (!__DEV__) {
    // Default production endpoint placeholder (override with EXPO_PUBLIC_API_URL during EAS/production builds)
    return 'https://api.freshdash.com/api/v1';
  }

  // Development environment:
  // When running via Expo Go / Dev Client on physical device or emulator,
  // extract host IP from hostUri (e.g. 192.168.1.35:8081 -> 192.168.1.35)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8000/api/v1`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }

  return 'http://127.0.0.1:8000/api/v1';
};

export const API_BASE_URL = getDefaultApiBaseUrl();

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    SIGNUP: '/auth/signup/',
    LOGOUT: '/auth/logout/',
    REFRESH: '/auth/token/refresh/',
    ME: '/auth/me/',
  },
  PRODUCTS: '/products/',
  CATEGORIES: '/categories/',
  CART: '/cart/',
  ORDERS: '/orders/',
  ADDRESSES: '/addresses/',
  FAVORITES: '/favorites/',
  COUPONS: '/coupons/',
} as const;

