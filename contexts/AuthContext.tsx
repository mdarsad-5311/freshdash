import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { AuthUser, LoginPayload, SignupPayload, UpdateProfilePayload } from '../types/auth';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { secureStorage } from '../services/secureStorage';
import { registerSessionExpiredListener } from '../services/api';
import { useShop } from '../store/useShop';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session from SecureStore on startup
  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const [token, cachedUser] = await Promise.all([
          secureStorage.getAccessToken(),
          secureStorage.getUserData(),
        ]);

        if (token && mounted) {
          if (cachedUser) {
            setUser(cachedUser);
          }

          // Verify token & sync fresh profile from backend
          try {
            const freshUser = await authService.getCurrentUser();
            if (mounted) {
              setUser(freshUser);
              void useShop.getState().syncCartWithBackend();
              void useShop.getState().syncFavouritesWithBackend();
            }
          } catch {
            // Token expired or invalid; session will be cleared by interceptor if refresh fails
          }
        }
      } catch {
        // Storage error or unauthenticated
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    // Listen for automatic session expiration (e.g. invalid/blacklisted refresh token)
    const unsubscribe = registerSessionExpiredListener(() => {
      if (mounted) {
        setUser(null);
        useShop.getState().resetCart();
        useShop.getState().resetFavourites();
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    if (response.user) {
      setUser(response.user);
    } else {
      // Fetch user profile if not directly provided in login response
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    }
    void useShop.getState().syncCartWithBackend();
    void useShop.getState().syncFavouritesWithBackend();
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    const response = await authService.signup(payload);
    if (response.user) {
      setUser(response.user);
    } else {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    }
    void useShop.getState().syncCartWithBackend();
    void useShop.getState().syncFavouritesWithBackend();
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      useShop.getState().resetCart();
      useShop.getState().resetFavourites();
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const updatedUser = await profileService.getProfile();
      setUser(updatedUser);
    } catch {
      // If fetching fails, leave current state
    }
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload): Promise<AuthUser> => {
    const updated = await profileService.updateProfile(payload);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
      refreshProfile,
      updateProfile,
    }),
    [user, isLoading, login, signup, logout, refreshProfile, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

