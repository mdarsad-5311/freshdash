import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Platform-safe haptic feedback wrapper.
 * Gracefully no-ops on unsupported environments (web, simulators without haptics).
 */
export const haptics = {
  selection: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics unavailable on current device/environment
    }
  },

  success: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics unavailable
    }
  },

  lightImpact: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics unavailable
    }
  },
};

// Aliases for convenient direct imports
export const triggerSelectionHaptic = haptics.selection;
export const triggerSuccessHaptic = haptics.success;
