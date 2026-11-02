/* global jest, beforeEach */

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// In-memory store for expo-secure-store mock (prefixed with "mock" for jest hoist)
const mockSecureStore = new Map();

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(async () => true),
  WHEN_UNLOCKED: 'WHEN_UNLOCKED',
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  ALWAYS: 'ALWAYS',
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY',
  getItemAsync: jest.fn(async (key) => mockSecureStore.get(key) || null),
  setItemAsync: jest.fn(async (key, value) => {
    mockSecureStore.set(key, String(value));
  }),
  deleteItemAsync: jest.fn(async (key) => {
    mockSecureStore.delete(key);
  }),
  __mockStore: mockSecureStore,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: '192.168.1.35:8081',
    name: 'FreshDash',
    slug: 'freshdash',
  },
}));

// Mock expo-font and @expo-google-fonts/inter
jest.mock('@expo-google-fonts/inter', () => ({
  useFonts: () => [true, null],
}));

jest.mock('expo-font', () => ({
  isLoaded: () => true,
  loadAsync: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => {
  return {
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
      navigate: jest.fn(),
    },
    useLocalSearchParams: jest.fn(() => ({})),
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    })),
    Stack: Object.assign(
      ({ children }) => children,
      { Screen: () => null }
    ),
    Tabs: Object.assign(
      ({ children }) => children,
      { Screen: () => null }
    ),
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        return function MockIcon(props) {
          return React.createElement(View, { testID: `icon-${String(prop)}`, ...props });
        };
      },
    }
  );
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// Reset mocks before each test
beforeEach(() => {
  mockSecureStore.clear();
  jest.clearAllMocks();
});
