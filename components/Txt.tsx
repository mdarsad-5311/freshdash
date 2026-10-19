import React from 'react';
import { Text as RNText, TextProps, StyleSheet, TextStyle } from 'react-native';
import { colors, fonts } from '../constants/theme';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type TextVariant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'micro';

export interface TxtProps extends TextProps {
  weight?: TextWeight;
  variant?: TextVariant;
  color?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<TextVariant, TextStyle> = {
  display: { fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  title: { fontSize: 18, lineHeight: 24, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, lineHeight: 21 },
  body: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
  micro: { fontSize: 11, lineHeight: 14 },
};

export function Txt({
  style,
  weight = 'regular',
  variant,
  color,
  children,
  ...rest
}: TxtProps) {
  const fontFamily = fonts[weight] || fonts.regular;

  return (
    <RNText
      style={[
        styles.base,
        variant && variantStyles[variant],
        { fontFamily },
        color ? { color } : undefined,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

export const Typography = Txt;

const styles = StyleSheet.create({
  base: {
    color: colors.ink,
    fontSize: 14,
  },
});
