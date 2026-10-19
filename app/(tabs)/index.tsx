import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Pressable,
  Image,
  Modal,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import {
  Leaf,
  Clock3,
  MapPin,
  ChevronDown,
  Truck,
  ShieldCheck,
  ArrowRight,
  X,
  Check,
} from 'lucide-react-native';
import { colors } from '../../constants/theme';
import {
  categories,
  Product,
  getFeaturedVegetables,
  getFeaturedFruits,
  getBestsellers,
  getSeasonalProduct,
} from '../../constants/products';
import { useShop, DeliveryAddress } from '../../store/useShop';
import { Txt } from '../../components/Txt';
import { Screen } from '../../components/Screen';
import { SearchBar } from '../../components/SearchBar';
import { ProductCard } from '../../components/ProductCard';
import { CategoryCard } from '../../components/CategoryCard';
import { SectionTitle } from '../../components/SectionTitle';
import { ProducePhoto } from '../../components/ProducePhoto';
import { WalkthroughTip } from '../../components/WalkthroughTip';

const HERO_IMAGE = require('../../assets/images/harvest-hero.png');

const QUICK_CATEGORIES = [
  { ...categories[1], name: 'Fruits' },
  { ...categories[0], name: 'Vegetables' },
  { ...categories[2], name: 'Leafy greens' },
  { ...categories[8], name: 'Exotic fruits' },
];

const ADDRESS_PRESETS: { label: DeliveryAddress; address: string }[] = [
  { label: 'Home', address: 'HSR Layout, Bengaluru' },
  { label: 'Work', address: 'Indiranagar, Bengaluru' },
];

interface ProductShelfProps {
  title: string;
  items: Product[];
  cardWidth: number;
  onSeeAll: () => void;
}

function ProductShelf({ title, items, cardWidth, onSeeAll }: ProductShelfProps) {
  return (
    <View>
      <SectionTitle title={title} onPress={onSeeAll} />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.shelf}
        renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
      />
    </View>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const address = useShop((s) => s.address);
  const setAddress = useShop((s) => s.setAddress);
  const walkthroughStep = useShop((s) => s.walkthroughStep);

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const fullAddress = address === 'Home' ? 'HSR Layout, Bengaluru' : 'Indiranagar, Bengaluru';
  const cardWidth = Math.max(158, Math.min(180, 0.42 * width));

  const featuredVegetables = useMemo(() => getFeaturedVegetables(), []);
  const featuredFruits = useMemo(() => getFeaturedFruits(), []);
  const bestsellers = useMemo(() => getBestsellers(), []);
  const seasonalProduct = useMemo(() => getSeasonalProduct(), []);

  const navigateToListing = (category: string) => {
    router.push({
      pathname: '/listing',
      params: { category },
    });
  };

  return (
    <Screen style={styles.screenBg}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.topRow}>
            <View style={styles.brand}>
              <Leaf size={21} color={colors.green} strokeWidth={1.8} />
              <Txt weight="bold" style={styles.brandText}>
                freshly.
              </Txt>
            </View>
            <View style={styles.delivery}>
              <Clock3 size={14} color={colors.darkGreen} strokeWidth={1.8} />
              <Txt weight="semibold" style={styles.deliveryText}>
                10–15 minutes
              </Txt>
            </View>
          </View>

          <Pressable onPress={() => setLocationModalVisible(true)} style={styles.location}>
            <MapPin size={16} color={colors.ink} strokeWidth={1.8} />
            <Txt weight="semibold" style={styles.locationText} numberOfLines={1}>
              {address} · {fullAddress}
            </Txt>
            <ChevronDown size={15} color={colors.ink} strokeWidth={1.8} />
          </Pressable>

          <SearchBar onPress={() => navigateToListing('all')} />
          <WalkthroughTip step={0} />
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.hero}>
            <Image source={HERO_IMAGE} resizeMode="cover" style={styles.heroImage} />
            <View style={styles.heroCopy}>
              <Txt
                weight="bold"
                style={[styles.heroTitle, width < 360 && styles.heroTitleSmall]}
              >
                {'A little fresher.\nA lot better.'}
              </Txt>
              <Txt style={styles.heroCaption}>
                {width < 360 ? 'Fresh picks. Delivered.' : 'Farm-fresh picks, at your door.'}
              </Txt>
              <Pressable
                onPress={() => navigateToListing('all')}
                style={styles.heroButton}
              >
                <Txt weight="semibold" style={styles.heroButtonText}>
                  Shop fresh
                </Txt>
                <Truck size={15} color={colors.white} strokeWidth={1.8} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.promise}>
          <Leaf size={14} color={colors.green} strokeWidth={1.8} />
          <Txt style={styles.promiseText}>Freshly picked</Txt>
          <View style={styles.dot} />
          <ShieldCheck size={14} color={colors.green} strokeWidth={1.8} />
          <Txt style={styles.promiseText}>Quality checked</Txt>
        </View>

        <View
          onLayout={(e) => {
            if (walkthroughStep === 1) {
              scrollRef.current?.scrollTo({
                y: Math.max(0, e.nativeEvent.layout.y - 16),
                animated: false,
              });
            }
          }}
        >
          <View style={styles.categories}>
            {QUICK_CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={
                  width < 360 && cat.id === 'vegetables'
                    ? { ...cat, name: 'Veggies' }
                    : cat
                }
                width={(width - 64) / 4}
              />
            ))}
          </View>
          <View style={styles.walkthroughWrapper}>
            <WalkthroughTip step={1} />
          </View>
        </View>

        <View
          onLayout={(e) => {
            if (walkthroughStep === 2) {
              scrollRef.current?.scrollTo({
                y: Math.max(0, e.nativeEvent.layout.y - 16),
                animated: false,
              });
            }
          }}
        >
          <View style={styles.walkthroughWrapper}>
            <WalkthroughTip step={2} />
          </View>
          <ProductShelf
            title="Fresh vegetables"
            items={featuredVegetables}
            cardWidth={cardWidth}
            onSeeAll={() => navigateToListing('vegetables')}
          />
        </View>

        <ProductShelf
          title="Fresh fruits"
          items={featuredFruits}
          cardWidth={cardWidth}
          onSeeAll={() => navigateToListing('fruits')}
        />

        <Pressable
          style={styles.seasonal}
          onPress={() => navigateToListing('seasonal')}
        >
          <View style={styles.seasonalCopy}>
            <Txt weight="bold" style={styles.seasonalTitle}>
              A taste of the season
            </Txt>
            <Txt style={styles.seasonalSubtitle}>
              Sweet Alphonso mangoes are here.
            </Txt>
            <View style={styles.seasonalRow}>
              <Txt weight="semibold" style={styles.seasonalLink}>
                Explore seasonal picks
              </Txt>
              <ArrowRight size={15} color={colors.green} strokeWidth={1.8} />
            </View>
          </View>
          <View style={styles.seasonalPhoto}>
            <ProducePhoto index={seasonalProduct?.photo ?? 6} size={110} />
          </View>
        </Pressable>

        <ProductShelf
          title="Everyday bestsellers"
          items={bestsellers}
          cardWidth={cardWidth}
          onSeeAll={() => navigateToListing('all')}
        />

        <View style={styles.bottomBrand}>
          <Txt weight="bold" style={styles.bottomBrandTitle}>
            {'Good food.\nGood mood.'}
          </Txt>
          <Txt style={styles.bottomBrandSubtitle}>
            Fresh finds for your everyday.
          </Txt>
        </View>
      </ScrollView>

      <Modal
        visible={locationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <View style={styles.modalTopRow}>
              <Txt weight="bold" style={styles.modalTitle}>
                Deliver to
              </Txt>
              <Pressable
                accessibilityLabel="Close locations"
                onPress={() => setLocationModalVisible(false)}
                hitSlop={12}
              >
                <X size={22} color={colors.ink} />
              </Pressable>
            </View>

            {ADDRESS_PRESETS.map((loc) => {
              const isSelected = address === loc.label;
              return (
                <Pressable
                  key={loc.label}
                  style={styles.addressRow}
                  onPress={() => {
                    setAddress(loc.label);
                    setLocationModalVisible(false);
                  }}
                >
                  <MapPin size={20} color={colors.green} />
                  <View style={styles.addressInfo}>
                    <Txt weight="semibold">{loc.label}</Txt>
                    <Txt style={styles.addressSub}>{loc.address}</Txt>
                  </View>
                  {isSelected && <Check size={20} color={colors.green} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenBg: {
    backgroundColor: colors.paleYellow,
  },
  scrollContent: {
    paddingBottom: 28,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.paleYellow,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandText: {
    fontSize: 25,
    color: colors.green,
    letterSpacing: -1,
  },
  delivery: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.yellow,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 7,
  },
  deliveryText: {
    fontSize: 11,
    color: colors.darkGreen,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 15,
    marginBottom: 17,
  },
  locationText: {
    fontSize: 13,
    flexShrink: 1,
  },
  heroWrap: {
    marginHorizontal: 20,
    marginTop: 18,
  },
  hero: {
    height: 168,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.paleYellow,
  },
  heroImage: {
    width: '100%',
    height: 168,
    position: 'absolute',
  },
  heroCopy: {
    padding: 16,
    width: '65%',
  },
  heroTitle: {
    fontSize: 23,
    lineHeight: 28,
    color: colors.darkGreen,
    letterSpacing: -0.7,
  },
  heroTitleSmall: {
    fontSize: 20,
    lineHeight: 25,
  },
  heroCaption: {
    fontSize: 11,
    marginTop: 7,
    color: colors.darkGreen,
  },
  heroButton: {
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 9,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 32,
    marginTop: 15,
  },
  heroButtonText: {
    color: colors.white,
    fontSize: 12,
  },
  promise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 18,
  },
  promiseText: {
    fontSize: 11,
    color: colors.muted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.muted,
    marginHorizontal: 4,
  },
  categories: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
  },
  walkthroughWrapper: {
    marginHorizontal: 20,
  },
  shelf: {
    paddingHorizontal: 20,
    gap: 12,
  },
  seasonal: {
    marginHorizontal: 20,
    marginTop: 27,
    padding: 18,
    backgroundColor: colors.softGreen,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seasonalCopy: {
    flex: 1,
  },
  seasonalTitle: {
    color: colors.darkGreen,
    fontSize: 20,
  },
  seasonalSubtitle: {
    color: colors.darkGreen,
    marginTop: 7,
    fontSize: 12,
  },
  seasonalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 15,
  },
  seasonalLink: {
    color: colors.green,
    fontSize: 12,
    flexShrink: 1,
  },
  seasonalPhoto: {
    borderRadius: 55,
    overflow: 'hidden',
  },
  bottomBrand: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 15,
  },
  bottomBrandTitle: {
    fontSize: 31,
    color: colors.muted,
  },
  bottomBrandSubtitle: {
    color: colors.muted,
    marginTop: 10,
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background,
    padding: 24,
    paddingBottom: 36,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 19,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 21,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addressInfo: {
    flex: 1,
  },
  addressSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 5,
  },
});
