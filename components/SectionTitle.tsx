import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { colors } from '../constants/theme';
import { Txt } from './Txt';

export interface SectionTitleProps {
  title: string;
  onPress?: () => void;
}

export function SectionTitle({ title, onPress }: SectionTitleProps) {
  return (
    <View style={styles.sectionTitle}>
      <Txt weight="bold" style={styles.title}>
        {title}
      </Txt>
      {onPress && (
        <Pressable onPress={onPress} style={styles.row}>
          <Txt weight="semibold" style={styles.seeAll}>
            See all
          </Txt>
          <ArrowRight size={14} color={colors.green} strokeWidth={1.8} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    marginTop: 26,
    gap: 10,
  },
  title: {
    fontSize: 19,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  seeAll: {
    color: colors.green,
    fontSize: 12,
  },
});
