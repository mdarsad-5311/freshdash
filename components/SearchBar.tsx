import React from 'react';
import { View, TextInput, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { colors, fonts } from '../constants/theme';
import { Txt } from './Txt';

export interface SearchBarProps {
  value?: string;
  onChange?: (text: string) => void;
  onPress?: () => void;
  placeholder?: string;
  filter?: boolean;
  onFilter?: () => void;
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChange,
  onPress,
  placeholder = 'Search fruits, vegetables...',
  filter = false,
  onFilter,
  style,
}: SearchBarProps) {
  const content = (
    <>
      <Search size={20} color={colors.muted} strokeWidth={1.8} />
      {onChange ? (
        <TextInput
          accessibilityLabel="Search products"
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      ) : (
        <Txt style={styles.searchPlaceholder} numberOfLines={1}>
          {placeholder}
        </Txt>
      )}
      {filter && onFilter && (
        <Pressable
          accessibilityLabel="Sort products"
          onPress={onFilter}
          hitSlop={12}
        >
          <SlidersHorizontal size={19} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable style={[styles.search, style]} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.search, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  search: {
    height: 48,
    borderRadius: 13,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.ink,
    paddingVertical: 10,
    minWidth: 0,
  },
  searchPlaceholder: {
    fontSize: 13,
    color: colors.muted,
    flex: 1,
  },
});
