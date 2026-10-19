import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShoppingBasket } from 'lucide-react-native';
import { colors } from '../constants/theme';
import { Txt } from './Txt';
import { ActionButton } from './ActionButton';

export interface EmptyStateProps {
  title: string;
  message: string;
  action: string;
  onPress?: () => void;
}

export function EmptyState({ title, message, action, onPress }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <ShoppingBasket size={54} color={colors.green} strokeWidth={1.5} />
      <Txt weight="bold" style={styles.title}>
        {title}
      </Txt>
      <Txt style={styles.message}>{message}</Txt>
      <ActionButton onPress={onPress}>{action}</ActionButton>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 340,
  },
  title: {
    fontSize: 21,
    marginTop: 20,
    textAlign: 'center',
  },
  message: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 21,
  },
});
