import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { colors } from '../constants/theme';
import { Txt } from './Txt';

export interface QuantityControlProps {
  quantity: number;
  onMinus: () => void;
  onPlus: () => void;
  compact?: boolean;
  style?: ViewStyle;
}

export function QuantityControl({
  quantity,
  onMinus,
  onPlus,
  compact = false,
  style,
}: QuantityControlProps) {
  return (
    <View style={[styles.quantity, compact && styles.compact, style]}>
      <Pressable
        accessibilityLabel="Decrease quantity"
        hitSlop={8}
        onPress={onMinus}
      >
        <Minus color={colors.green} size={16} strokeWidth={1.8} />
      </Pressable>
      <Txt weight="semibold" style={{ color: colors.green }}>
        {quantity}
      </Txt>
      <Pressable
        accessibilityLabel="Increase quantity"
        hitSlop={8}
        onPress={onPlus}
      >
        <Plus color={colors.green} size={16} strokeWidth={1.8} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  quantity: {
    width: 104,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: colors.softGreen,
  },
  compact: {
    width: 70,
    height: 34,
  },
});
