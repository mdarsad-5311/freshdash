import React, { useState } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  Heart,
  Clock3,
  Check,
  Leaf,
  ShieldCheck,
  ShoppingBasket,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';
import { products, formatCurrency, calculateDiscount } from '../../constants/products';
import { useShop } from '../../store/useShop';
import { haptics } from '../../utils/haptics';
import { Txt } from '../../components/Txt';
import { ProducePhoto } from '../../components/ProducePhoto';
import { QuantityControl } from '../../components/QuantityControl';
import { ActionButton } from '../../components/ActionButton';
import { SectionTitle } from '../../components/SectionTitle';
import { ProductCard } from '../../components/ProductCard';
import { EmptyState } from '../../components/EmptyState';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { width } = useWindowDimensions();

  const product = products.find((p) => p.id === id);

  const [isDoublePack, setIsDoublePack] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const favourites = useShop((s) => s.favourites);
  const toggleFavourite = useShop((s) => s.toggleFavourite);
  const add = useShop((s) => s.add);

  if (!product) {
    return (
      <EmptyState
        title="Product not found"
        message="Find something fresh in our collection."
        action="Browse produce"
        onPress={() => router.replace('/categories')}
      />
    );
  }

  const isFavourite = favourites.includes(product.id);
  const unitPrice = product.price * (isDoublePack ? 2 : 1);
  const unitOriginal = product.original * (isDoublePack ? 2 : 1);
  const discount = calculateDiscount(unitPrice, unitOriginal);
  const totalPrice = unitPrice * quantity;

  const photoSize = Math.min(width - 40, 330);
  const pairsWellWith = products.filter((p) => p.id !== id).slice(0, 5);

  const handleAddToCart = () => {
    if (addedToCart) {
      router.push('/cart');
    } else {
      add(product.id, quantity, isDoublePack);
      setAddedToCart(true);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Fresh picks',
          headerBackButtonDisplayMode: 'minimal',
          headerRight: () => (
            <Pressable
              accessibilityLabel="Open shopping cart"
              hitSlop={10}
              onPress={() => router.push('/cart')}
            >
              <ShoppingBasket size={23} color={colors.ink} strokeWidth={1.8} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.photoContainer}>
          <ProducePhoto index={product.photo} size={photoSize} />

          <Pressable
            accessibilityLabel={
              isFavourite ? 'Remove from favourites' : 'Save to favourites'
            }
            onPress={() => toggleFavourite(product.id)}
            style={styles.heartButton}
          >
            <Heart
              size={23}
              color={isFavourite ? colors.green : colors.muted}
              fill={isFavourite ? colors.green : 'transparent'}
              strokeWidth={1.8}
            />
          </Pressable>

          <View style={styles.deliveryBadge}>
            <Clock3 size={13} color={colors.darkGreen} />
            <Txt weight="medium" style={styles.deliveryText}>
              10–15 minutes
            </Txt>
          </View>
        </View>

        <View style={styles.info}>
          <Txt weight="bold" style={styles.name}>
            {product.name}
          </Txt>
          <Txt style={styles.weight}>{product.weight}</Txt>

          <View style={styles.priceRow}>
            <Txt weight="bold" style={styles.price}>
              {formatCurrency(unitPrice)}
            </Txt>
            <Txt style={styles.original}>{formatCurrency(unitOriginal)}</Txt>
            {discount > 0 && (
              <View style={styles.discount}>
                <Txt weight="semibold" style={styles.discountText}>
                  {discount}% off
                </Txt>
              </View>
            )}
          </View>

          <Txt weight="semibold" style={styles.heading}>
            Select pack
          </Txt>
          <View style={styles.weights}>
            {[false, true].map((doublePack) => {
              const isSelected = isDoublePack === doublePack;
              return (
                <Pressable
                  key={String(doublePack)}
                  onPress={() => {
                    setIsDoublePack(doublePack);
                    setAddedToCart(false);
                    haptics.selection();
                  }}
                  style={[styles.weightOption, isSelected && styles.selectedWeight]}
                >
                  <Txt
                    weight="semibold"
                    style={{
                      color: isSelected ? colors.green : colors.ink,
                      fontSize: 13,
                    }}
                  >
                    {doublePack ? 'Double pack' : product.weight}
                  </Txt>
                  <Txt style={styles.weightPrice}>
                    {formatCurrency(product.price * (doublePack ? 2 : 1))}
                  </Txt>
                  {isSelected && (
                    <Check
                      size={15}
                      color={colors.green}
                      style={styles.checkIcon}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.quality}>
            <View style={styles.qualityItem}>
              <Leaf size={19} color={colors.green} strokeWidth={1.8} />
              <Txt weight="medium" style={styles.qualityText}>
                Farm fresh
              </Txt>
            </View>
            <View style={styles.qualityDivider} />
            <View style={styles.qualityItem}>
              <ShieldCheck size={19} color={colors.green} strokeWidth={1.8} />
              <Txt weight="medium" style={styles.qualityText}>
                Quality checked
              </Txt>
            </View>
          </View>

          <Txt weight="semibold" style={styles.heading}>
            About this product
          </Txt>
          <Txt style={styles.description}>{product.description}</Txt>

          <View style={styles.quantityRow}>
            <Txt weight="semibold">Quantity</Txt>
            <QuantityControl
              quantity={quantity}
              onMinus={() => {
                if (quantity > 1) {
                  setQuantity((q) => q - 1);
                  setAddedToCart(false);
                  haptics.selection();
                }
              }}
              onPlus={() => {
                setQuantity((q) => q + 1);
                setAddedToCart(false);
                haptics.selection();
              }}
            />
          </View>
        </View>

        <SectionTitle title="Pairs well with" />
        <FlatList
          horizontal
          data={pairsWellWith}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pairsShelf}
          renderItem={({ item }) => <ProductCard product={item} width={165} />}
        />
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Txt style={styles.footerPacks}>
            {quantity} {quantity === 1 ? 'pack' : 'packs'}
          </Txt>
          <Txt weight="bold" style={styles.footerPrice}>
            {formatCurrency(totalPrice)}
          </Txt>
        </View>
        <ActionButton
          style={styles.footerButton}
          onPress={handleAddToCart}
        >
          {addedToCart ? 'View cart' : 'Add to cart'}
        </ActionButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 25,
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: colors.white,
    position: 'relative',
  },
  heartButton: {
    position: 'absolute',
    right: 22,
    top: 16,
    padding: 9,
    borderRadius: 50,
    backgroundColor: colors.background,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    position: 'absolute',
    left: 20,
    bottom: 16,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: colors.softGreen,
    borderRadius: 6,
  },
  deliveryText: {
    fontSize: 11,
    color: colors.darkGreen,
  },
  info: {
    paddingHorizontal: 20,
    paddingTop: 23,
  },
  name: {
    fontSize: 23,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  weight: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 17,
  },
  price: {
    fontSize: 25,
  },
  original: {
    color: colors.muted,
    fontSize: 15,
    textDecorationLine: 'line-through',
  },
  discount: {
    backgroundColor: colors.softGreen,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    color: colors.green,
  },
  heading: {
    fontSize: 15,
    marginTop: 26,
    marginBottom: 12,
  },
  weights: {
    flexDirection: 'row',
    gap: 12,
  },
  weightOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.white,
    position: 'relative',
  },
  selectedWeight: {
    borderColor: colors.green,
    backgroundColor: colors.softGreen,
  },
  weightPrice: {
    marginTop: 7,
    color: colors.muted,
    fontSize: 12,
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  quality: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.softGreen,
    borderRadius: 12,
    marginTop: 25,
    gap: 12,
  },
  qualityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  qualityText: {
    fontSize: 11,
    color: colors.darkGreen,
    flexShrink: 1,
  },
  qualityDivider: {
    height: 22,
    width: 1,
    backgroundColor: colors.border,
  },
  description: {
    fontSize: 13,
    lineHeight: 22,
    color: colors.muted,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  pairsShelf: {
    paddingHorizontal: 20,
    gap: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  footerPacks: {
    color: colors.muted,
    fontSize: 11,
  },
  footerPrice: {
    fontSize: 20,
    marginTop: 4,
  },
  footerButton: {
    flex: 1,
  },
});
