import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../constants/theme';
import { Txt } from './Txt';

export interface ActionButtonProps {
  children?: React.ReactNode;
  onPress?: () => void;
  secondary?: boolean;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
}

export function ActionButton({
  children,
  onPress,
  secondary = false,
  style,
  disabled = false,
}: ActionButtonProps) {
  const textColor = secondary ? colors.green : colors.white;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        style,
        { opacity: pressed || disabled ? 0.65 : 1 },
      ]}
    >
      <Txt weight="semibold" style={{ color: textColor, fontSize: 14 }}>
        {children}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.green,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.softGreen,
    borderColor: colors.green,
    borderWidth: 1,
  },
});
