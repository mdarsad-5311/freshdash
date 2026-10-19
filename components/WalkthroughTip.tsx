import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '../constants/theme';
import { useShop } from '../store/useShop';
import { Txt } from './Txt';
import { ActionButton } from './ActionButton';

export interface WalkthroughTipProps {
  step: number;
}

const TIPS = [
  {
    title: 'Find your fresh favourites',
    copy: 'Tap the search bar to look for a fruit or vegetable.',
  },
  {
    title: 'Browse by category',
    copy: 'Tap a category above, or open the Categories tab for the full selection.',
  },
  {
    title: 'Add your picks',
    copy: 'Tap Add on a product below. Use + or − to adjust it, then open Cart to review your picks.',
  },
];

export function WalkthroughTip({ step }: WalkthroughTipProps) {
  const currentStep = useShop((s) => s.walkthroughStep);
  const nextWalkthroughStep = useShop((s) => s.nextWalkthroughStep);
  const dismissWalkthrough = useShop((s) => s.dismissWalkthrough);

  if (currentStep !== step) return null;

  const tip = TIPS[step];
  const stepNumber = step + 1;
  const nextLabel = step === 2 ? 'Done' : 'Next tip';

  return (
    <View style={styles.tip} accessibilityLiveRegion="polite">
      <View style={styles.topRow}>
        <Txt weight="medium" style={styles.progress}>
          Quick tour · {stepNumber} of 3
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip walkthrough"
          onPress={dismissWalkthrough}
          hitSlop={8}
          style={styles.close}
        >
          <X size={18} strokeWidth={1.8} color={colors.muted} />
        </Pressable>
      </View>

      <Txt weight="bold" accessibilityRole="header" style={styles.title}>
        {tip.title}
      </Txt>
      <Txt style={styles.copy}>{tip.copy}</Txt>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={dismissWalkthrough}
          style={styles.skip}
        >
          <Txt weight="medium" style={styles.skipLabel}>
            Skip tour
          </Txt>
        </Pressable>
        <ActionButton onPress={nextWalkthroughStep} style={styles.next}>
          {nextLabel}
        </ActionButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tip: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  progress: {
    color: colors.green,
    fontSize: 12,
    flexShrink: 1,
  },
  close: {
    minHeight: 32,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    lineHeight: 23,
    marginTop: 4,
  },
  copy: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
  },
  skip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
    flexShrink: 1,
  },
  skipLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  next: {
    minHeight: 44,
    paddingHorizontal: 20,
  },
});
