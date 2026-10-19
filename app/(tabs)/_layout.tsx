import React from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, LayoutGrid, ShoppingBasket, UserRound } from 'lucide-react-native';
import { colors, fonts } from '../../constants/theme';
import { useShop, selection } from '../../store/useShop';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const cart = useShop((s) => s.cart);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const tabHeight = 70 + insets.bottom;
  const paddingBottom = 9 + insets.bottom;

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenListeners={{
          tabPress: () => {
            selection();
          },
        }}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopColor: colors.border,
            elevation: 0,
            height: tabHeight,
            paddingTop: 9,
            paddingBottom,
          },
          tabBarActiveTintColor: colors.green,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: {
            fontFamily: fonts.medium,
            fontSize: 11,
            lineHeight: 16,
            marginTop: 0,
          },
          tabBarBadgeStyle: {
            backgroundColor: colors.green,
            color: colors.white,
            fontSize: 10,
            fontFamily: fonts.semibold,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Home size={23} color={color} strokeWidth={1.8} />,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Categories',
            tabBarIcon: ({ color }) => <LayoutGrid size={23} color={color} strokeWidth={1.8} />,
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            tabBarBadge: totalItems > 0 ? totalItems : undefined,
            tabBarIcon: ({ color }) => <ShoppingBasket size={23} color={color} strokeWidth={1.8} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <UserRound size={23} color={color} strokeWidth={1.8} />,
          }}
        />
      </Tabs>
    </>
  );
}
