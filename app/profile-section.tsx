import React, { useState } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Pressable,
  Switch,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  PackageCheck,
  MapPin,
  Check,
  TicketPercent,
  ChevronDown,
} from 'lucide-react-native';
import { colors } from '../constants/theme';
import { products } from '../constants/products';
import { useShop } from '../store/useShop';
import { haptics } from '../utils/haptics';
import { Txt } from '../components/Txt';
import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';
import { ActionButton } from '../components/ActionButton';

const ADDRESS_OPTIONS = [
  {
    name: 'Home' as const,
    line: '24, 18th Main Road, Sector 2',
    area: 'HSR Layout, Bengaluru · 560102',
  },
  {
    name: 'Work' as const,
    line: '8, 100 Feet Road',
    area: 'Indiranagar, Bengaluru · 560038',
  },
];

const FAQS = [
  {
    q: 'How does FreshDash work?',
    a: 'Browse farm-fresh fruits, vegetables and greens. Add items to your basket and experience instant delivery in 10–15 minutes.',
  },
  {
    q: 'Will checking out place a real order?',
    a: 'No, this is a local client demonstration showcasing quick-commerce UX, state management, and haptics.',
  },
  {
    q: 'Can I change my delivery address?',
    a: 'Yes, switch between your saved Home and Work addresses from the address selector on the Home screen or in this section.',
  },
];

export default function ProfileSectionScreen() {
  const { section = 'My orders' } = useLocalSearchParams<{ section?: string }>();
  const { width } = useWindowDimensions();

  const favourites = useShop((s) => s.favourites);
  const currentAddress = useShop((s) => s.address);
  const setAddress = useShop((s) => s.setAddress);

  const [orderUpdates, setOrderUpdates] = useState(true);
  const [offersNotif, setOffersNotif] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const favProducts = products.filter((p) => favourites.includes(p.id));
  const cardWidth = (width - 52) / 2;

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: section,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      {section === 'Favourite products' ? (
        <FlatList
          data={favProducts}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.favColumnWrapper}
          contentContainerStyle={styles.favListContent}
          renderItem={({ item }) => (
            <View style={styles.favCardWrapper}>
              <ProductCard product={item} width={cardWidth} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="Save your fresh favourites"
              message="Tap the heart on a product to find it here."
              action="Explore produce"
              onPress={() => router.push('/categories')}
            />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {section === 'My orders' && (
            <>
              <View style={styles.note}>
                <Txt style={styles.noteText}>Recent order history</Txt>
              </View>
              <View style={styles.card}>
                <View style={styles.row}>
                  <PackageCheck size={24} color={colors.green} />
                  <Txt weight="semibold" style={styles.flex1}>
                    Delivered
                  </Txt>
                  <Txt weight="bold">₹141</Txt>
                </View>
                <Txt style={styles.orderDate}>12 October · 3 items</Txt>
                <View style={styles.divider} />
                <Txt style={styles.orderItems}>
                  Fresh red tomatoes, Banana Robusta, Fresh green broccoli
                </Txt>
                <Txt style={styles.orderNumber}>Order #FR1024</Txt>
                <ActionButton
                  secondary
                  style={styles.orderButton}
                  onPress={() => router.push('/categories')}
                >
                  Shop these favourites
                </ActionButton>
              </View>
            </>
          )}

          {section === 'Saved addresses' && (
            <>
              <Txt style={styles.subNote}>Select your delivery destination</Txt>
              {ADDRESS_OPTIONS.map((item) => {
                const isSelected = currentAddress === item.name;
                return (
                  <Pressable
                    key={item.name}
                    style={[styles.card, isSelected && styles.selectedAddressCard]}
                    onPress={() => {
                      setAddress(item.name);
                      haptics.selection();
                    }}
                  >
                    <View style={styles.row}>
                      <MapPin size={20} color={colors.green} />
                      <Txt weight="bold" style={styles.flex1}>
                        {item.name}
                      </Txt>
                      {isSelected && <Check size={19} color={colors.green} />}
                    </View>
                    <Txt style={styles.addressLine}>{item.line}</Txt>
                    <Txt style={styles.addressArea}>{item.area}</Txt>
                  </Pressable>
                );
              })}
            </>
          )}

          {section === 'Offers and coupons' && (
            <View style={[styles.card, styles.offersCard]}>
              <TicketPercent
                size={32}
                color={colors.darkGreen}
                strokeWidth={1.5}
              />
              <Txt weight="bold" style={styles.offerTitle}>
                A fresh little saving.
              </Txt>
              <Txt style={styles.offerSubtitle}>
                Get 20% off your basket, up to ₹50.
              </Txt>
              <View style={styles.couponBox}>
                <Txt weight="bold" style={styles.couponCode}>
                  FRESH20
                </Txt>
                <Pressable
                  onPress={() => {
                    setCodeCopied(true);
                    haptics.success();
                  }}
                >
                  <Txt weight="semibold" style={styles.couponAction}>
                    {codeCopied ? 'Ready to use' : 'Use code'}
                  </Txt>
                </Pressable>
              </View>
              <ActionButton onPress={() => router.push('/cart')}>
                Open basket
              </ActionButton>
            </View>
          )}

          {section === 'Help and support' && (
            <>
              <Txt weight="bold" style={styles.faqTitle}>
                Frequently Asked Questions
              </Txt>
              {FAQS.map((faq, index) => {
                const isExpanded = expandedFaq === index;
                return (
                  <Pressable
                    key={faq.q}
                    style={styles.faq}
                    onPress={() => {
                      setExpandedFaq(isExpanded ? null : index);
                      haptics.selection();
                    }}
                  >
                    <View style={styles.row}>
                      <Txt weight="semibold" style={styles.faqQ}>
                        {faq.q}
                      </Txt>
                      <ChevronDown
                        size={18}
                        color={colors.muted}
                        style={{
                          transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                        }}
                      />
                    </View>
                    {isExpanded && <Txt style={styles.faqA}>{faq.a}</Txt>}
                  </Pressable>
                );
              })}
            </>
          )}

          {section === 'Settings' && (
            <View style={styles.card}>
              <View style={styles.setting}>
                <Txt weight="medium" style={styles.flex1}>
                  Order updates
                </Txt>
                <Switch
                  accessibilityLabel="Order updates"
                  value={orderUpdates}
                  onValueChange={(val) => {
                    setOrderUpdates(val);
                    haptics.selection();
                  }}
                  trackColor={{ false: colors.border, true: colors.green }}
                  thumbColor={colors.white}
                />
              </View>

              <View style={styles.setting}>
                <Txt weight="medium" style={styles.flex1}>
                  Offers and fresh finds
                </Txt>
                <Switch
                  accessibilityLabel="Offers and fresh finds"
                  value={offersNotif}
                  onValueChange={(val) => {
                    setOffersNotif(val);
                    haptics.selection();
                  }}
                  trackColor={{ false: colors.border, true: colors.green }}
                  thumbColor={colors.white}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Txt style={styles.flex1}>Language</Txt>
                <Txt style={styles.settingMuted}>English</Txt>
              </View>

              <View style={[styles.row, { marginTop: 22 }]}>
                <Txt style={styles.flex1}>App version</Txt>
                <Txt style={styles.settingMuted}>1.0.0</Txt>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 35,
  },
  card: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 17,
  },
  selectedAddressCard: {
    borderColor: colors.green,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  note: {
    marginBottom: 17,
  },
  noteText: {
    fontSize: 12,
    color: colors.muted,
  },
  subNote: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 20,
  },
  orderDate: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 14,
  },
  orderItems: {
    fontSize: 13,
    lineHeight: 22,
  },
  orderNumber: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 12,
  },
  orderButton: {
    marginTop: 22,
  },
  addressLine: {
    fontSize: 13,
    marginTop: 14,
  },
  addressArea: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 6,
  },
  offersCard: {
    backgroundColor: colors.paleYellow,
  },
  offerTitle: {
    fontSize: 24,
    marginTop: 19,
  },
  offerSubtitle: {
    color: colors.darkGreen,
    lineHeight: 21,
    fontSize: 13,
    marginTop: 10,
  },
  couponBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 17,
    borderWidth: 1,
    borderColor: colors.yellow,
    borderStyle: 'dashed',
    borderRadius: 10,
    marginVertical: 23,
  },
  couponCode: {
    color: colors.darkGreen,
    fontSize: 19,
  },
  couponAction: {
    color: colors.green,
    fontSize: 12,
  },
  faqTitle: {
    fontSize: 22,
    marginBottom: 24,
  },
  faq: {
    backgroundColor: colors.white,
    padding: 19,
    borderRadius: 13,
    marginBottom: 12,
  },
  faqQ: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  faqA: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 22,
    marginTop: 14,
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 12,
  },
  settingMuted: {
    color: colors.muted,
  },
  favColumnWrapper: {
    gap: 12,
  },
  favListContent: {
    padding: 20,
  },
  favCardWrapper: {
    marginBottom: 12,
  },
});
