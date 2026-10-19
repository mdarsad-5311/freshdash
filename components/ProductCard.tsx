import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { colors } from '../constants/theme';
import { Product, formatCurrency, calculateDiscount } from '../constants/products';
import { useShop } from '../store/useShop';
import { Txt } from './Txt';
import { ProducePhoto } from './ProducePhoto';
import { QuantityControl } from './QuantityControl';

export interface ProductCardProps {
  product: Product;
  width: number;
}

export function ProductCard({ product, width }: ProductCardProps) {
  const cart = useShop((s) => s.cart);
  const add = useShop((s) => s.add);
  const change = useShop((s) => s.change);

  const cartItem = cart.find((item) => item.productId === product.id && !item.large);
  const discount = calculateDiscount(product.price, product.original);
  const photoSize = width - 26;

  const handleOpen = () => {
    router.push({
      pathname: '/product/[id]',
      params: { id: product.id },
    });
  };

  return (
    <View style={[styles.product, { width }]}>
      <Pressable accessibilityLabel={`View ${product.name}`} onPress={handleOpen}>
        <View style={styles.photoArea}>
          <ProducePhoto index={product.photo} size={photoSize} />
          {discount > 0 && (
            <View style={styles.discount}>
              <Txt weight="semibold" style={styles.discountText}>
                {discount}% off
              </Txt>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Txt style={styles.weight}>{product.weight}</Txt>
          <Txt weight="semibold" style={styles.productName} numberOfLines={2}>
            {product.name}
          </Txt>
        </View>
      </Pressable>

      <View style={styles.productBottom}>
        <View>
          <Txt weight="bold" style={styles.price}>
            {formatCurrency(product.price)}
          </Txt>
          <Txt style={styles.original}>{formatCurrency(product.original)}</Txt>
        </View>

        {cartItem ? (
          <QuantityControl
            compact
            quantity={cartItem.quantity}
            onMinus={() => change(cartItem.key, -1)}
            onPlus={() => change(cartItem.key, 1)}
          />
        ) : (
          <Pressable
            accessibilityLabel={`Add ${product.name}`}
            onPress={() => add(product.id)}
            style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
          >
            <Txt weight="semibold" style={styles.addText}>
              Add
            </Txt>
            <Plus size={14} color={colors.green} strokeWidth={1.8} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  product: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.045,
    shadowRadius: 5,
    elevation: 2,
  },
  photoArea: {
    alignItems: 'center',
    position: 'relative',
  },
  discount: {
    position: 'absolute',
    top: 0,
    left: -2,
    backgroundColor: colors.softGreen,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  discountText: {
    color: colors.darkGreen,
    fontSize: 11,
  },
  productInfo: {
    marginTop: 8,
  },
  weight: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 5,
  },
  productName: {
    fontSize: 13,
    lineHeight: 19,
    height: 38,
  },
  productBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 3,
    marginTop: 12,
  },
  price: {
    fontSize: 14,
  },
  original: {
    fontSize: 11,
    color: colors.muted,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  add: {
    height: 34,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: colors.softGreen,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  addPressed: {
    opacity: 0.75,
  },
  addText: {
    color: colors.green,
    fontSize: 12,
  },
});
