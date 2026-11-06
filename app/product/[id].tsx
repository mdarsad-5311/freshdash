import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
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
import { products as fallbackProducts, formatCurrency, calculateDiscount } from '../../constants/products';
import { Product } from '../../types/product';
import { productService } from '../../services/productService';
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

  const initialFallback = id ? fallbackProducts.find((p) => p.id === id) || null : null;
  const [product, setProduct] = useState<Product | null>(initialFallback);
  const [pairsWellWith, setPairsWellWith] = useState<Product[]>(() =>
    initialFallback ? fallbackProducts.filter((p) => p.id !== id).slice(0, 5) : []
  );

  const [loading, setLoading] = useState(!initialFallback);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDoublePack, setIsDoublePack] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const favourites = useShop((s) => s.favourites);
  const toggleFavourite = useShop((s) => s.toggleFavourite);
  const add = useShop((s) => s.add);

  const loadProductData = useCallback(
    async (isRefresh = false) => {
      if (!id) return;
      if (isRefresh) {
        setRefreshing(true);
      } else if (!product) {
        setLoading(true);
      }
      setError(null);

      try {
        const [prodResult, pairsResult] = await Promise.allSettled([
          productService.getProduct(id),
          productService.getPairsWellWith(id),
        ]);

        if (prodResult.status === 'fulfilled') {
          setProduct(prodResult.value);
        } else if (!product) {
          setError(prodResult.reason?.message || 'Product not found');
        }

        if (pairsResult.status === 'fulfilled' && pairsResult.value.length > 0) {
          setPairsWellWith(pairsResult.value);
        }
      } catch (err: any) {
        if (!product) {
          setError(err?.message || 'Product not found');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, product]
  );

  useEffect(() => {
    let active = true;
    if (!id) return;

    (async () => {
      try {
        const [prodResult, pairsResult] = await Promise.allSettled([
          productService.getProduct(id),
          productService.getPairsWellWith(id),
        ]);

        if (!active) return;

        if (prodResult.status === 'fulfilled') {
          setProduct(prodResult.value);
          setError(null);
        } else if (!initialFallback) {
          setError(prodResult.reason?.message || 'Product not found');
        }

        if (pairsResult.status === 'fulfilled' && pairsResult.value.length > 0) {
          setPairsWellWith(pairsResult.value);
        }
      } catch (err: any) {
        if (active && !initialFallback) {
          setError(err?.message || 'Product not found');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [id, initialFallback]);

  if (loading && !product) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.screen}>
        <Stack.Screen
          options={{
            title: 'Fresh picks',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Txt style={styles.statusText}>Loading product details...</Txt>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <EmptyState
        title="Product not found"
        message={error || 'Find something fresh in our collection.'}
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
          title: product.category_name || 'Fresh picks',
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProductData(true)}
            tintColor={colors.green}
            colors={[colors.green]}
          />
        }
      >
        <View style={styles.photoContainer}>
          <ProducePhoto index={product.photo} size={photoSize} imageUrl={product.image} />

          <Pressable
            accessibilityLabel={
              isFavourite ? 'Remove from favourites' : 'Save to favourites'
            }
            onPress={() => toggleFavourite(product.id, product)}
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

        {pairsWellWith.length > 0 && (
          <>
            <SectionTitle title="Pairs well with" />
            <FlatList
              horizontal
              data={pairsWellWith}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pairsShelf}
              renderItem={({ item }) => <ProductCard product={item} width={165} />}
            />
          </>
        )}
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
    top: 14,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryBadge: {
    position: 'absolute',
    bottom: 14,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.softGreen,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  deliveryText: {
    color: colors.darkGreen,
    fontSize: 12,
  },
  info: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
  },
  name: {
    fontSize: 22,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  weight: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 20,
  },
  price: {
    fontSize: 26,
    color: colors.ink,
  },
  original: {
    fontSize: 16,
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  discount: {
    backgroundColor: colors.softGreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: colors.green,
    fontSize: 12,
  },
  heading: {
    fontSize: 16,
    marginBottom: 12,
  },
  weights: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  weightOption: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    position: 'relative',
  },
  selectedWeight: {
    borderColor: colors.green,
    backgroundColor: colors.softGreen,
  },
  weightPrice: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  checkIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  quality: {
    flexDirection: 'row',
    backgroundColor: colors.softGreen,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    alignItems: 'center',
  },
  qualityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  qualityDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  qualityText: {
    fontSize: 13,
    color: colors.darkGreen,
  },
  description: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 21,
    marginBottom: 24,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pairsShelf: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerPacks: {
    fontSize: 12,
    color: colors.muted,
  },
  footerPrice: {
    fontSize: 20,
    color: colors.ink,
  },
  footerButton: {
    flex: 0.6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  statusText: {
    color: colors.muted,
    fontSize: 14,
  },
});
