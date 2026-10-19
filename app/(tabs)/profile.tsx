import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  ShoppingBag,
  MapPin,
  Heart,
  TicketPercent,
  CircleHelp,
  Settings,
  UserRound,
  ChevronRight,
  Leaf,
} from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { useShop } from '../../store/useShop';
import { haptics } from '../../utils/haptics';
import { Txt } from '../../components/Txt';
import { Screen } from '../../components/Screen';

const PROFILE_MENU = [
  { title: 'My orders', icon: ShoppingBag },
  { title: 'Saved addresses', icon: MapPin },
  { title: 'Favourite products', icon: Heart },
  { title: 'Offers and coupons', icon: TicketPercent },
  { title: 'Help and support', icon: CircleHelp },
  { title: 'Settings', icon: Settings },
];

export default function ProfileScreen() {
  const favourites = useShop((s) => s.favourites);

  const handleMenuPress = (title: string) => {
    haptics.selection();
    router.push({
      pathname: '/profile-section',
      params: { section: title },
    });
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Txt weight="bold" style={styles.title}>
          Your profile
        </Txt>

        <View style={styles.profile}>
          <View style={styles.avatar}>
            <UserRound size={35} color={colors.darkGreen} strokeWidth={1.5} />
          </View>
          <View style={styles.profileInfo}>
            <Txt weight="bold" style={styles.greeting}>
              Hello, fresh foodie
            </Txt>
            <Txt style={styles.tagline}>
              A little goodness, every day.
            </Txt>
          </View>
        </View>

        <View style={styles.rows}>
          {PROFILE_MENU.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === PROFILE_MENU.length - 1;
            return (
              <Pressable
                key={item.title}
                onPress={() => handleMenuPress(item.title)}
                style={[styles.row, isLast && styles.noBorder]}
              >
                <Icon size={22} color={colors.darkGreen} strokeWidth={1.8} />
                <Txt weight="medium" style={styles.rowTitle}>
                  {item.title}
                </Txt>
                {item.title === 'Favourite products' && favourites.length > 0 && (
                  <Txt style={styles.favBadge}>{favourites.length}</Txt>
                )}
                <ChevronRight size={18} color={colors.muted} strokeWidth={1.8} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.banner}>
          <Leaf size={27} color={colors.green} strokeWidth={1.5} />
          <Txt weight="semibold" style={styles.bannerTitle}>
            Freshness is our favourite thing.
          </Txt>
          <Txt style={styles.bannerSubtitle}>
            And we think it’ll be yours, too.
          </Txt>
        </View>

        <View style={styles.brand}>
          <Txt weight="bold" style={styles.brandName}>
            freshly.
          </Txt>
          <Txt style={styles.brandVersion}>
            Version 1.0.0
          </Txt>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 25,
    letterSpacing: -0.7,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 31,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.paleYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 21,
  },
  tagline: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 7,
  },
  rows: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  rowTitle: {
    flex: 1,
    fontSize: 14,
  },
  favBadge: {
    color: colors.green,
    fontSize: 12,
  },
  banner: {
    marginTop: 26,
    backgroundColor: colors.softGreen,
    borderRadius: 16,
    padding: 24,
  },
  bannerTitle: {
    color: colors.darkGreen,
    fontSize: 16,
    marginTop: 12,
  },
  bannerSubtitle: {
    color: colors.darkGreen,
    fontSize: 12,
    marginTop: 7,
  },
  brand: {
    alignItems: 'center',
    marginTop: 33,
  },
  brandName: {
    fontSize: 25,
    color: colors.green,
    letterSpacing: -0.8,
  },
  brandVersion: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 7,
  },
});
