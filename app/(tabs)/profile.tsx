import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
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
  LogOut,
  LogIn,
  ShieldCheck,
} from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { useShop } from '../../store/useShop';
import { useAuth } from '../../contexts/AuthContext';
import { haptics } from '../../utils/haptics';
import { Txt } from '../../components/Txt';
import { Screen } from '../../components/Screen';

const PROFILE_MENU = [
  { title: 'Profile details', icon: UserRound, requiresAuth: true },
  { title: 'My orders', icon: ShoppingBag, requiresAuth: true },
  { title: 'Saved addresses', icon: MapPin, requiresAuth: true },
  { title: 'Favourite products', icon: Heart, requiresAuth: false },
  { title: 'Offers and coupons', icon: TicketPercent, requiresAuth: false },
  { title: 'Help and support', icon: CircleHelp, requiresAuth: false },
  { title: 'Settings', icon: Settings, requiresAuth: false },
];

export default function ProfileScreen() {
  const favourites = useShop((s) => s.favourites);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleMenuPress = (title: string, requiresAuth: boolean) => {
    haptics.selection();
    if (requiresAuth && !isAuthenticated) {
      Alert.alert(
        'Sign in required',
        `Please sign in to access ${title.toLowerCase()}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign in',
            onPress: () => router.push('/(auth)/login'),
          },
        ]
      );
      return;
    }

    router.push({
      pathname: '/profile-section',
      params: { section: title },
    });
  };

  const handleLogout = () => {
    haptics.selection();
    Alert.alert('Log out', 'Are you sure you want to log out of FreshDash?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          haptics.success();
        },
      },
    ]);
  };

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Txt weight="bold" style={styles.title}>
          Your profile
        </Txt>

        <Pressable
          style={styles.profile}
          onPress={() => {
            if (isAuthenticated) {
              handleMenuPress('Profile details', true);
            }
          }}
        >
          <View style={styles.avatar}>
            <UserRound size={35} color={colors.darkGreen} strokeWidth={1.5} />
          </View>
          <View style={styles.profileInfo}>
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.green}
                style={{ alignSelf: 'flex-start', marginVertical: 14 }}
              />
            ) : isAuthenticated && user ? (
              <>
                <Txt weight="bold" style={styles.greeting} numberOfLines={1}>
                  {displayName}
                </Txt>
                <Txt style={styles.tagline} numberOfLines={1}>
                  {user.email}
                </Txt>
                <View style={styles.memberBadge}>
                  <ShieldCheck size={13} color={colors.green} />
                  <Txt weight="medium" style={styles.memberBadgeText}>
                    FreshDash Member · Edit
                  </Txt>
                </View>
              </>
            ) : (
              <>
                <Txt weight="bold" style={styles.greeting}>
                  Hello, fresh foodie
                </Txt>
                <Txt style={styles.tagline}>
                  Sign in to view orders & saved addresses.
                </Txt>
                <Pressable
                  style={styles.signInPill}
                  onPress={() => {
                    haptics.selection();
                    router.push('/(auth)/login');
                  }}
                >
                  <LogIn size={14} color={colors.white} />
                  <Txt weight="semibold" style={styles.signInPillText}>
                    Log in / Sign up
                  </Txt>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>

        <View style={styles.rows}>
          {PROFILE_MENU.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === PROFILE_MENU.length - 1 && !isAuthenticated;
            return (
              <Pressable
                key={item.title}
                onPress={() => handleMenuPress(item.title, item.requiresAuth)}
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

          {isAuthenticated ? (
            <Pressable
              onPress={handleLogout}
              style={[styles.row, styles.noBorder, styles.logoutRow]}
            >
              <LogOut size={22} color={colors.red} strokeWidth={1.8} />
              <Txt weight="medium" style={styles.logoutTitle}>
                Log out
              </Txt>
            </Pressable>
          ) : null}
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
    paddingVertical: 26,
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
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 20,
  },
  tagline: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.softGreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  memberBadgeText: {
    color: colors.green,
    fontSize: 11,
  },
  signInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  signInPillText: {
    color: colors.white,
    fontSize: 12,
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
    paddingVertical: 20,
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
  logoutRow: {
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutTitle: {
    flex: 1,
    fontSize: 14,
    color: colors.red,
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
