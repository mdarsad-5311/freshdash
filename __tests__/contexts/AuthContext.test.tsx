import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, Pressable, View } from 'react-native';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { secureStorage } from '../../services/secureStorage';
import { useShop } from '../../store/useShop';

// Test consumer component
function TestAuthConsumer() {
  const { user, isAuthenticated, isLoading, login, logout, signup } = useAuth();

  return (
    <View>
      <Text testID="loading-state">{isLoading ? 'loading' : 'ready'}</Text>
      <Text testID="auth-state">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</Text>
      <Text testID="user-name">{user ? user.username : 'no-user'}</Text>

      <Pressable
        testID="login-btn"
        onPress={() => login({ username: 'testuser', password: 'password123' })}
      >
        <Text>Login</Text>
      </Pressable>

      <Pressable
        testID="signup-btn"
        onPress={() =>
          signup({
            username: 'newuser',
            email: 'new@freshdash.com',
            password: 'password123',
            password_confirm: 'password123',
          })
        }
      >
        <Text>Signup</Text>
      </Pressable>

      <Pressable testID="logout-btn" onPress={() => logout()}>
        <Text>Logout</Text>
      </Pressable>
    </View>
  );
}

describe('AuthContext & AuthProvider', () => {
  beforeEach(async () => {
    await secureStorage.clearAllAuthData();
    useShop.setState({ cart: [] });
    jest.clearAllMocks();
  });

  it('initializes as unauthenticated when no stored token exists', async () => {
    await render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('ready');
    });

    expect(screen.getByTestId('auth-state').props.children).toBe('unauthenticated');
    expect(screen.getByTestId('user-name').props.children).toBe('no-user');
  });

  it('restores cached user on mount when access token exists', async () => {
    const cachedUser = {
      id: 99,
      username: 'cached_john',
      email: 'john@freshdash.com',
    };
    await secureStorage.setAccessToken('stored_token');
    await secureStorage.setUserData(cachedUser);

    jest.spyOn(authService, 'getCurrentUser').mockResolvedValueOnce(cachedUser);

    await render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').props.children).toBe('authenticated');
    });

    expect(screen.getByTestId('user-name').props.children).toBe('cached_john');
  });

  it('successfully logs in, updates user state and syncs cart', async () => {
    const loggedInUser = {
      id: 12,
      username: 'logged_user',
      email: 'logged@freshdash.com',
    };

    const loginSpy = jest.spyOn(authService, 'login').mockResolvedValueOnce({
      success: true,
      message: 'Login successful',
      tokens: { access: 'acc_123', refresh: 'ref_123' },
      user: loggedInUser,
    });
    const syncCartSpy = jest.spyOn(useShop.getState(), 'syncCartWithBackend').mockResolvedValueOnce();

    await render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('ready');
    });

    fireEvent.press(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect(screen.getByTestId('user-name').props.children).toBe('logged_user');
      expect(screen.getByTestId('auth-state').props.children).toBe('authenticated');
    });

    expect(syncCartSpy).toHaveBeenCalled();
  });

  it('successfully signs up and sets user state', async () => {
    const signedUpUser = {
      id: 15,
      username: 'newuser',
      email: 'new@freshdash.com',
    };

    jest.spyOn(authService, 'signup').mockResolvedValueOnce({
      success: true,
      message: 'Signup successful',
      tokens: { access: 'acc_signup', refresh: 'ref_signup' },
      user: signedUpUser,
    });

    await render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('ready');
    });

    fireEvent.press(screen.getByTestId('signup-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('user-name').props.children).toBe('newuser');
      expect(screen.getByTestId('auth-state').props.children).toBe('authenticated');
    });
  });

  it('logs out and clears authenticated state', async () => {
    const logoutSpy = jest.spyOn(authService, 'logout').mockResolvedValueOnce();

    await render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('ready');
    });

    fireEvent.press(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalled();
      expect(screen.getByTestId('auth-state').props.children).toBe('unauthenticated');
      expect(screen.getByTestId('user-name').props.children).toBe('no-user');
    });
  });
});
